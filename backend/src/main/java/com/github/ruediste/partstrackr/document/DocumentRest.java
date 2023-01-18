package com.github.ruediste.partstrackr.document;

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

import com.github.ruediste.partstrackr.EmQuery;
import com.github.ruediste.partstrackr.part.Part;
import com.github.ruediste.partstrackr.part.Part_;

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
		if (entity.primaryPhoto != doc.primaryPhoto) {
			if (doc.primaryPhoto)
				entity.part.documents.forEach(d -> d.primaryPhoto = false);
			entity.primaryPhoto = doc.primaryPhoto;
		}
		service.updatePrimaryPhoto(entity);
	}

	@DELETE
	@Path("{id}")
	public void deleteDocument(@PathParam("id") long id) {
		service.deleteDocument(id);
	}

	@POST
	@Path("{id}/_scaleDown")
	public void scaleDown(@PathParam("id") long id) {
		service.scaleDown(id);
	}

	@POST
	@Path("_updateAllPrimaryPhotos")
	public void updateAllPrimaryPhotos() {
		Long lastId = null;
		while (true) {
			var lastIdF = lastId;
			var nextParts = new EmQuery<>(em, Part.class) {
				{
					if (lastIdF != null) {
						where.add(cb.gt(root.get(Part_.id), lastIdF));
					}
					q.orderBy(cb.asc(root.get(Part_.id)));
					setMaxResults(10);
				}
			}.getResultList();

			nextParts.forEach(service::updatePrimaryPhoto);
			em.flush();
			em.clear();
			if (nextParts.size() < 10)
				return;
			lastId = nextParts.get(nextParts.size() - 1).id;
		}
	}
}
