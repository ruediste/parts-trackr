package com.github.ruediste.partstrackr.document;

import java.io.IOException;
import java.nio.file.Files;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
@Path("api/document")
@Produces(MediaType.APPLICATION_JSON)
public class DocumentRest {
	@PersistenceContext
	private EntityManager em;

	@Autowired
	DocumentService service;

	@GET
	@Path("{id}/{fileName:.*}")
	public Response downloadDocument(@PathParam("id") long id) {
		var doc = em.find(Document.class, id);
		var path = service.getFilePath(doc);
		return Response.ok(path.toFile()).header("Content-Type", doc.mimeType).build();
	}

	@POST
	@Path("{id}")
	public void updateDocument(@PathParam("id") long id, Document doc) {
		var entity = em.find(Document.class, id);
		entity.name = doc.name;
		entity.mimeType = doc.mimeType;
	}

	@DELETE
	@Path("{id}")
	public void deleteDocument(@PathParam("id") long id) {
		var doc = em.find(Document.class, id);
		var path = service.getFilePath(doc);

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
		em.remove(doc);
	}
}
