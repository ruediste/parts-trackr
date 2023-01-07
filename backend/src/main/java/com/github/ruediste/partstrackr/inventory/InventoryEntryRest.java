package com.github.ruediste.partstrackr.inventory;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.criteria.Predicate;
import javax.transaction.Transactional;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ruediste.partstrackr.location.LocationParameterDefinition;
import com.github.ruediste.partstrackr.location.LocationParameterDefinition_;
import com.github.ruediste.partstrackr.location.Location_;

@Component
@Transactional
@Path("api/inventoryEntry")
@Produces(MediaType.APPLICATION_JSON)
public class InventoryEntryRest {
	@PersistenceContext
	private EntityManager em;

	@Autowired
	private ObjectMapper objectMapper;

	public static class LocationParameterValuePMod {
		public Long id;
		public LocationParameterDefinition definition;
		public String value;
	}

	public static class InventoryEntryPMod {
		public String locationName;
		public long id;
		public int count;
		public Long locationId;
		public String parameterValuesDescription;

		public String partName;
	}

	@GET
	public List<InventoryEntryPMod> search(@QueryParam("maxCount") Integer maxCount,
			@QueryParam("locationId") Integer locationId, @QueryParam("parameterValues") String parameterValues) {

		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(InventoryEntry.class);
		var entry = q.from(InventoryEntry.class);
		q.select(entry);
		List<Predicate> where = new ArrayList<>();
		if (locationId != null) {
			where.add(cb.equal(entry.get(InventoryEntry_.location).get(Location_.id), locationId));
		}

		if (parameterValues != null) {
			try {
				var values = objectMapper.readValue(parameterValues, new TypeReference<Map<Long, String>>() {
				});
				for (var valueEntry : values.entrySet()) {
					System.out.println(valueEntry.getKey() + ": " + valueEntry.getValue());
					if (valueEntry.getValue() == null || valueEntry.getValue().isEmpty())
						continue;
					var sub = q.subquery(LocationParameterValue.class);
					var subFrom = sub.from(LocationParameterValue.class);
					sub.select(subFrom);
					sub.where(
							cb.equal(subFrom.get(LocationParameterValue_.definition)
									.get(LocationParameterDefinition_.id), valueEntry.getKey()),
							cb.equal(subFrom.get(LocationParameterValue_.value), valueEntry.getValue()),
							cb.equal(subFrom.get(LocationParameterValue_.entry), entry));

					where.add(cb.exists(sub));
				}
			} catch (JsonProcessingException e) {
				throw new RuntimeException(e);
			}
		}
		q.where(where.toArray(new Predicate[where.size()]));

		var typedQuery = em.createQuery(q);
		if (maxCount != null)
			typedQuery.setMaxResults(maxCount);
		return typedQuery.getResultList().stream().map(this::toPMod).toList();
	}

	@GET
	@Path("{id}")
	public InventoryEntryPMod get(@PathParam("id") long id) {
		return toPMod(em.find(InventoryEntry.class, id));
	}

	public InventoryEntryPMod toPMod(InventoryEntry entry) {
		var pMod = new InventoryEntryPMod();
		pMod.id = entry.id;
		pMod.count = entry.count;

		if (entry.part != null) {
			pMod.partName = entry.part.name;
		}

		if (entry.location != null) {
			pMod.locationName = entry.location.name;
			pMod.locationId = entry.location.id;
		}

		if (entry.parameterValues != null)
			pMod.parameterValuesDescription = entry.parameterValues.stream()
					.sorted(Comparator.comparing(x -> x.definition.name))
					.map(x -> x.definition.name + ": " + x.definition.format(x.value))
					.collect(Collectors.joining((", ")));
		return pMod;
	}

	@GET
	@Path("{id}/parameterValue")
	public List<LocationParameterValuePMod> getParameterValues(@PathParam("id") long id) {
		InventoryEntry entry = em.find(InventoryEntry.class, id);
		if (entry.location == null)
			return List.of();
		var valueMap = entry.parameterValues.stream().collect(Collectors.toMap(x -> x.definition.id, x -> x));
		return entry.location.parameterDefinitions.stream().sorted(Comparator.comparing(x -> x.name))
				.map(definition -> toPMod(definition, valueMap.get(definition.id))).toList();
	}

	@POST
	@Path("{id}/parameterValue")
	public LocationParameterValuePMod addParameterValue(@PathParam("id") long id, LocationParameterValuePMod pMod) {
		InventoryEntry entry = em.find(InventoryEntry.class, id);
		LocationParameterValue value = new LocationParameterValue();
		value.value = pMod.value;
		value.entry = entry;
		value.definition = em.find(LocationParameterDefinition.class, pMod.definition.id);
		em.persist(value);
		em.flush();
		return toPMod(value.definition, value);
	}

	@POST
	@Path("{id}/parameterValue/{valueId}")
	public LocationParameterValuePMod updateParameterValue(@PathParam("valueId") long valueId,
			LocationParameterValuePMod pMod) {
		LocationParameterValue value = em.find(LocationParameterValue.class, valueId);
		value.value = pMod.value;
		return toPMod(value.definition, value);
	}

	@DELETE
	@Path("{id}/parameterValue/{valueId}")
	public void deleteParameterValue(@PathParam("valueId") long valueId) {
		LocationParameterValue value = em.find(LocationParameterValue.class, valueId);
		em.remove(value);
	}

	private LocationParameterValuePMod toPMod(LocationParameterDefinition definition, LocationParameterValue value) {
		LocationParameterValuePMod pMod = new LocationParameterValuePMod();
		pMod.definition = definition;
		if (value != null) {
			pMod.id = value.id;
			pMod.value = value.value;
		}
		return pMod;
	}
}
