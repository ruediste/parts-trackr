package com.github.ruediste.partstrackr.document;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.part.Part;

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
		var doc = new Document();
		doc.part = part;
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
		case "json" -> MediaType.APPLICATION_JSON + ";charset=utf-8";
		case "txt" -> MediaType.TEXT_PLAIN + ";charset=utf-8";
		case "html" -> MediaType.TEXT_HTML + ";charset=utf-8";
		default -> MediaType.APPLICATION_OCTET_STREAM;
		};

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
}
