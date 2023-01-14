package com.github.ruediste.partstrackr.part;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.github.ruediste.partstrackr.EmQuery;
import com.github.ruediste.partstrackr.document.DocumentService;
import com.github.ruediste.partstrackr.inventory.InventoryEntryRest;
import com.github.ruediste.partstrackr.inventory.InventoryEntryRest.PartReference;

@Component
@Transactional
@Path("api/browse")
@Produces(MediaType.APPLICATION_JSON)
public class BrowseRest {
	@PersistenceContext
	private EntityManager em;

	@Autowired
	DocumentService documentService;

	@Autowired
	PartService service;

	@Autowired
	InventoryEntryRest inventoryEntryRest;

	public static class PartBrowseChildPMod {
		public long id;
		public String name;
		public Long photoId;
		public String photoName;
	}

	public static class PartBrowsePMod {
		public boolean isRoot;
		public long id;
		public String name;
		public int inventorySum;
		public List<PartBrowseChildPMod> children;
		public List<PartReference> path;
		public String parameterValues;
	}

	@GET
	public PartBrowsePMod root() {
		PartBrowsePMod pMod = new PartBrowsePMod();
		pMod.isRoot = true;
		pMod.children = new EmQuery<>(em, Part.class) {
			{
				where(cb.isNull(root.get(Part_.parent)));
			}
		}.getResultList().stream().sorted(Part.childrenComparator(null)).map(this::toChildPMod).toList();
		pMod.path = List.of();
		pMod.parameterValues = "";
		return pMod;
	}

	@GET
	@Path("{id}")
	public PartBrowsePMod get(@PathParam("id") long id) {
		return toPMod(em.find(Part.class, id));
	}

	private PartBrowsePMod toPMod(Part part) {
		var pMod = new PartBrowsePMod();
		pMod.id = part.id;
		pMod.name = part.calculateName();
		pMod.children = part.children.stream().sorted(part.childrenComparator()).map(this::toChildPMod).toList();
		pMod.path = part.pathExcludingSelf().stream().map(PartReference::of).toList();
		pMod.parameterValues = part.parameterValuesDescription();
		return pMod;
	}

	private PartBrowseChildPMod toChildPMod(Part part) {
		var pMod = new PartBrowseChildPMod();
		pMod.id = part.id;
		pMod.name = part.calculateName();
		part.primaryPhoto().ifPresent(x -> {
			pMod.photoId = x.id;
			pMod.photoName = x.name;
		});
		return pMod;
	}
}
