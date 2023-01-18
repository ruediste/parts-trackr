package com.github.ruediste.partstrackr.document;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.part.Part;

import javaxt.io.Image;

@Component
public class DocumentService {

	@PersistenceContext
	EntityManager em;

	@Value("${documents.path:documents}")
	private String documentsPath;

	public Path getFilePath(Document document) {
		var documentId = document.id;
		return Paths.get(documentsPath, String.format("%02X", (documentId / 256) % 256),
				String.format("%02X", documentId % 256), Long.toString(documentId), document.fileName);
	}

	public Document addDocument(Part part, String fileName, InputStream body) {
		// make file name unique for photos
		if ("photo.jpg".equals(fileName)) {
			var existingNames = part.documents.stream().map(x -> x.name).collect(Collectors.toSet());
			int i = 0;
			while (existingNames.contains(fileName)) {
				fileName = "photo-" + (i++) + ".jpg";
			}
		}

		var doc = new Document();
		doc.part = part;
		part.documents.add(doc);
		doc.name = fileName;
		doc.fileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);
		var extension = "";
		{
			int idx = fileName.lastIndexOf(".");
			if (idx >= 0) {
				extension = fileName.substring(idx + 1);
			}
		}
		doc.mimeType = switch (extension) {
		case "pdf" -> "application/pdf";
		case "jpg", "jpeg" -> "image/jpeg";
		case "webp" -> "image/webp";
		case "json" -> MediaType.APPLICATION_JSON + ";charset=utf-8";
		case "txt" -> MediaType.TEXT_PLAIN + ";charset=utf-8";
		case "html" -> MediaType.TEXT_HTML + ";charset=utf-8";
		default -> MediaType.APPLICATION_OCTET_STREAM;
		};

		updatePrimaryPhoto(doc);
		em.persist(doc);
		em.flush();
		var path = getFilePath(doc);

		try {
			Files.createDirectories(path.getParent());
		} catch (IOException e) {
			throw new RuntimeException("Error while creating directory " + path.getParent().toAbsolutePath(), e);
		}

		try {
			Files.createDirectories(path.getParent());
			Files.copy(body, path);
		} catch (IOException e) {
			throw new RuntimeException("Error while uploading to " + path.toAbsolutePath(), e);
		}

		return doc;
	}

	public void scaleDown(long id) {
		try {
			var doc = em.find(Document.class, id);
			var path = getFilePath(doc);
			Image image = new Image(path.toFile());
			image.rotate();// Auto-rotate based on Exif Orientation tag, and remove all Exif tags
			image.resize(640, 480, true);
			image.setOutputQuality(0.9f);
			image.saveAs(path.toFile());
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public void deleteDocument(long id) {
		var doc = em.find(Document.class, id);
		var path = getFilePath(doc);

		// delete file itself
		try {
			Files.deleteIfExists(path);
		} catch (IOException e) {
			throw new RuntimeException("Error wile deleting " + path.toAbsolutePath(), e);
		}

		// delete empty parent folders
		for (int i = 0; i < 3; i++) {
			path = path.getParent();
			try {
				if (Files.list(path).count() == 0) {
					Files.delete(path);
				}
			} catch (IOException e) {
				throw new RuntimeException("Error wile deleting " + path.toAbsolutePath(), e);
			}
		}
		doc.part.documents.remove(doc);
		em.remove(doc);
		updatePrimaryPhoto(doc);
	}

	public void updatePrimaryPhoto(Document doc) {
		updatePrimaryPhoto(doc.part);
	}

	public void updatePrimaryPhoto(Part part) {
		var primaryPhotos = part.documents.stream().filter(x -> x.primaryPhoto).toList();
		if (primaryPhotos.isEmpty()) {
			part.documents.stream()
					.filter(x -> List.of("image/webp", "image/jpeg").contains(x.mimeType.toLowerCase(Locale.ENGLISH)))
					.findFirst().ifPresent(x -> x.primaryPhoto = true);
		}

		if (primaryPhotos.size() > 1) {
			primaryPhotos.stream().skip(1).forEach(x -> x.primaryPhoto = false);
		}
	}
}
