package com.github.ruediste.partstrackr.part;

import static java.util.stream.Collectors.toMap;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.github.ruediste.partstrackr.Pair;

@Component
@Transactional
@Path("api/part")
@Produces(MediaType.APPLICATION_JSON)
public class PartRest {
	@PersistenceContext
	private EntityManager em;

	public static class PartTreeItem {
		public long id;
		public String name;
		public boolean hasChildren;
		public List<String> cells;
	}

	public static class PartTreeColumn {
		public String label;
		public String unit;
	}

	public static class SubTree {
		public List<PartTreeItem> items;
		public List<PartTreeColumn> columns;
	}

	@GET
	public List<Part> search(@QueryParam("name") String nameQuery) {
		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(Part.class);
		var part = q.from(Part.class);
		q.select(part);
		if (StringUtils.hasText(nameQuery))
			q.where(cb.like(part.get(Part_.name), "%" + nameQuery + "%"));
		return em.createQuery(q).getResultList();
	}

	@GET
	@Path("roots")
	public SubTree rootParts() {
		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(Part.class);
		var part = q.from(Part.class);
		q.select(part);
		q.where(cb.isNull(part.get(Part_.parent)));
		return toSubTree(em.createQuery(q).getResultList());
	}

	@GET
	@Path("{id}/children")
	public SubTree children(@PathParam("id") long id) {
		return toSubTree(em.find(Part.class, id).children);
	}

	private SubTree toSubTree(Collection<Part> parts) {
		SubTree result = new SubTree();
		List<PartParameterDefinition> definitions = parts.stream().flatMap(x -> x.parameterValues.stream())
				.map(x -> x.definition).distinct().sorted(Comparator.comparing(x -> x.name)).toList();

		result.columns = definitions.stream().map(x -> {
			PartTreeColumn column = new PartTreeColumn();
			column.label = x.name;
			column.unit = x.unit == null ? null : x.unit.symbol;
			return column;
		}).toList();
		result.items = parts.stream().map(t -> toTreeItem(t, definitions)).sorted(Comparator.comparing(x -> x.name))
				.toList();
		return result;
	}

	private PartTreeItem toTreeItem(Part part, List<PartParameterDefinition> definitions) {
		var item = new PartTreeItem();
		item.id = part.id;
		item.name = part.name;
		item.hasChildren = !part.children.isEmpty();

		var parameters = part.parameterMap();
		item.cells = definitions.stream().map(def -> {
			var value = parameters.get(def);
			if (value == null)
				return null;
			return def.format(value.value);
		}).toList();

		if (part.parent != null && part.parent.childNameParameterDefinition != null) {
			var value = part.getAllParameterMap().get(part.parent.childNameParameterDefinition);
			if (value == null)
				item.name = "";
			else
				item.name = value.definition.format(value.value);
		}

		return item;
	}

	public static class PartParameterValuePMod {
		public Long id;
		public boolean inherited;
		public PartParameterDefinition definition;
		public String value;
	}

	public static class PartPMod {
		public long id;
		public Long parentId;
		public String name;
		public Long childNameParameterDefinitionId;
		public List<PartParameterValuePMod> parameterValues = new ArrayList<>();
		public boolean nameSetByParameterDefinition;
	}

	public void updatePart(Part part, PartPMod pMod) {
		part.name = pMod.name;

		if (pMod.parentId == null)
			part.parent = null;
		else
			part.parent = em.find(Part.class, pMod.parentId);

		if (pMod.childNameParameterDefinitionId == null) {
			part.childNameParameterDefinition = null;
		} else
			part.childNameParameterDefinition = em.find(PartParameterDefinition.class,
					pMod.childNameParameterDefinitionId);

		{
			var existingParameterValues = new HashMap<>(
					part.parameterValues.stream().collect(toMap(x -> x.id, x -> x)));
			for (var valPMod : pMod.parameterValues) {
				if (valPMod.id == null)
					continue;

				var val = existingParameterValues.remove(valPMod.id);
				if (val == null) {
					val = new PartParameterValue();
					val.value = valPMod.value;
					val.part = part;
					val.definition = em.find(PartParameterDefinition.class, valPMod.definition.id);
					em.persist(val);
				} else {
					val.value = valPMod.value;
				}
			}
			existingParameterValues.values().forEach(em::remove);
		}
	}

	@GET
	@Path("{id}")
	public PartPMod get(@PathParam("id") long id) {
		return toPMod(em.find(Part.class, id));
	}

	@POST
	public PartPMod add(PartPMod pMod) {
		Part part = new Part();
		updatePart(part, pMod);
		em.persist(part);
		em.flush();
		return toPMod(part);
	}

	@POST
	@Path("{id}")
	public PartPMod update(@PathParam("id") long id, PartPMod pMod) {
		var part = em.find(Part.class, id);
		updatePart(part, pMod);
		return toPMod(part);
	}

	@DELETE
	@Path("{id}")
	public void delete(@PathParam("id") long id) {
		var part = em.find(Part.class, id);
		em.remove(part);
	}

	@GET
	@Path("{id}/parameterDefinition")
	public List<PartParameterDefinition> getParameterDefinitions(@PathParam("id") long id) {
		return em.find(Part.class, id).parameterDefinitions.stream().sorted(Comparator.comparing(x -> x.name)).toList();
	}

	@POST
	@Path("{partId}/parameterDefinition")
	public PartParameterDefinition addParameterDefinition(@PathParam("partId") long partId,
			PartParameterDefinition definition) {
		definition.part = em.find(Part.class, partId);
		em.persist(definition);
		em.flush();
		return definition;
	}

	@GET
	@Path("{partId}/parameterDefinition/{definitionId}")
	public PartParameterDefinition getParameterDefinition(@PathParam("partId") long partId,
			@PathParam("definitionId") long definitionId) {
		return em.find(PartParameterDefinition.class, definitionId);
	}

	@POST
	@Path("{partId}/parameterDefinition/{definitionId}")
	public PartParameterDefinition updateParameterDefinition(@PathParam("partId") long partId,
			@PathParam("definitionId") long definitionId, PartParameterDefinition definition) {
		definition.id = definitionId;
		definition.part = em.find(Part.class, partId);
		definition = em.merge(definition);
		em.flush();
		return definition;
	}

	@DELETE
	@Path("{partId}/parameterDefinition/{definitionId}")
	public void deleteParameterDefinition(@PathParam("partId") long partId,
			@PathParam("definitionId") long definitionId) {
		em.remove(em.find(PartParameterDefinition.class, definitionId));
	}

	@GET
	@Path("{id}/parameterValue")
	public List<PartParameterValuePMod> getParameterValues(@PathParam("id") long id) {
		Part part = em.find(Part.class, id);
		return part.getAllParameters().stream().map(pair -> toPMod(part, pair)).toList();
	}

	private PartParameterValuePMod toPMod(PartParameterValue value) {
		return toPMod(value.part, Pair.of(value.definition, value));
	}

	private PartParameterValuePMod toPMod(Part part, Pair<PartParameterDefinition, PartParameterValue> pair) {
		PartParameterValuePMod pvPMod = new PartParameterValuePMod();
		pvPMod.definition = pair.getFirst();
		if (pair.getSecond() != null) {
			pvPMod.id = pair.getSecond().id;
			pvPMod.value = pair.getSecond().value;
			pvPMod.inherited = pair.getSecond().part != part;
		}
		return pvPMod;
	}

	@POST
	@Path("{partId}/parameterValue")
	public PartParameterValuePMod addParameterValue(@PathParam("partId") long partId,
			PartParameterValuePMod valuePMod) {
		PartParameterValue value = new PartParameterValue();
		value.part = em.find(Part.class, partId);
		value.definition = em.find(PartParameterDefinition.class, valuePMod.definition.id);
		value.value = valuePMod.value;
		em.persist(value);
		em.flush();
		return toPMod(value);
	}

	@GET
	@Path("{partId}/parameterValue/{valueId}")
	public PartParameterValuePMod getParameterValue(@PathParam("partId") long partId,
			@PathParam("valueId") long valueId) {
		return toPMod(em.find(PartParameterValue.class, valueId));
	}

	@POST
	@Path("{partId}/parameterValue/{valueId}")
	public PartParameterValuePMod updateParameterValue(@PathParam("partId") long partId,
			@PathParam("valueId") long valueId, PartParameterValuePMod valuePMod) {
		var value = em.find(PartParameterValue.class, valueId);
		value.value = valuePMod.value;
		return toPMod(value);
	}

	@DELETE
	@Path("{partId}/parameterValue/{valueId}")
	public void deleteParameterValue(@PathParam("partId") long partId, @PathParam("valueId") long valueId) {
		em.remove(em.find(PartParameterValue.class, valueId));
	}

	public PartPMod toPMod(Part part) {
		PartPMod pMod = new PartPMod();
		pMod.id = part.id;
		pMod.parentId = part.parent == null ? null : part.parent.id;
		pMod.name = part.name;

		if (part.childNameParameterDefinition != null) {
			pMod.childNameParameterDefinitionId = part.childNameParameterDefinition.id;
		}

		if (part.parent != null && part.parent.childNameParameterDefinition != null) {
			pMod.nameSetByParameterDefinition = true;
			var value = part.getAllParameterMap().get(part.parent.childNameParameterDefinition);
			if (value == null)
				pMod.name = "";
			else
				pMod.name = value.value;
		}

		pMod.parameterValues = part.getAllParameters().stream().map(pair -> {
			return toPMod(part, pair);
		}).toList();
		return pMod;
	}

}
