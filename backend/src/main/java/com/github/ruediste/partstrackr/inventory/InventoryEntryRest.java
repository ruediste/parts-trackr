package com.github.ruediste.partstrackr.inventory;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
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
import com.github.ruediste.partstrackr.EmQuery;
import com.github.ruediste.partstrackr.location.Location;
import com.github.ruediste.partstrackr.location.LocationParameterDefinition;
import com.github.ruediste.partstrackr.location.LocationParameterDefinition_;
import com.github.ruediste.partstrackr.location.Location_;
import com.github.ruediste.partstrackr.part.Part;

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

	public static class PartReference {
		public long id;
		public String name;

		public static PartReference of(Part part) {
			if (part == null)
				return null;
			PartReference ref = new PartReference();
			ref.id = part.id;
			ref.name = part.calculateName();
			return ref;
		}
	}

	public static class InventoryEntryPMod {
		public String locationName;
		public long id;
		public int count;
		public Long locationId;
		public String parameterValuesDescription;

		public PartReference part;

		public List<PartReference> path = List.of();
	}

	public <T> List<T> emQuery(EntityManager em, Class<T> cls) {
		return new EmQuery<T>(em, cls).getResultList();
	}

	@GET
	public List<InventoryEntryPMod> search(@QueryParam("maxCount") Integer maxCount,
			@QueryParam("locationId") Long locationId, @QueryParam("parameterValues") String parameterValues) {
		Map<Long, String> values;
		if (parameterValues == null)
			values = null;
		else
			try {
				values = objectMapper.readValue(parameterValues, new TypeReference<Map<Long, String>>() {
				});
			} catch (JsonProcessingException e) {
				throw new RuntimeException(e);
			}

		return buildQuery(locationId, values, maxCount).getResultList().stream().map(this::toPMod).toList();
	}

	@GET
	@Path("{id}")
	public InventoryEntryPMod get(@PathParam("id") long id) {
		return toPMod(em.find(InventoryEntry.class, id));
	}

	@POST
	@Path("{id}")
	public void update(@PathParam("id") long id, InventoryEntryPMod pMod) {
		var entity = em.find(InventoryEntry.class, id);
		entity.count = pMod.count;
		if (pMod.locationId != null) {
			entity.setLocation(em, pMod.locationId);
		}
	}

	public InventoryEntryPMod toPMod(InventoryEntry entry) {
		var pMod = new InventoryEntryPMod();
		pMod.id = entry.id;
		pMod.count = entry.count;

		if (entry.part != null) {
			pMod.part = PartReference.of(entry.part);
			pMod.path = entry.part.pathExcludingSelf().stream().map(PartReference::of).toList();
		}

		if (entry.location != null) {
			pMod.locationName = entry.location.name;
			pMod.locationId = entry.location.id;
		}

		if (entry.parameterValues != null)
			pMod.parameterValuesDescription = entry.parameterValuesDescription();
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

	public static class LocationParameterValues {
		public Long locationId;
		public Map<Long, String> values;
	}

	public static class UpdateLocationsArgs {
		public List<Long> selection;
		public LocationParameterValues filter;
		public LocationParameterValues values;
	}

	@POST
	@Path("updateLocations")
	public void updateLocations(UpdateLocationsArgs args) {
		if (args.values.locationId == null)
			return;

		List<InventoryEntry> entries;
		if (args.selection != null) {
			entries = args.selection.stream().map(id -> em.find(InventoryEntry.class, id)).toList();
		} else {
			entries = buildQuery(args.filter.locationId, args.filter.values, null).getResultList();
		}

		if (entries.size() > 10) {
			// throw new RuntimeException("Just safety " + entries.size());
		}

		var newLocation = em.find(Location.class, args.values.locationId);
		for (var entry : entries) {
			if (entry.location.id != newLocation.id) {
				entry.location = newLocation;
				entry.parameterValues.forEach(em::remove);
				entry.parameterValues.clear();
			}

			var parameterValuesMap = entry.parameterValues.stream()
					.collect(Collectors.toMap(x -> x.definition.id, x -> x));
			for (var valueEntry : args.values.values.entrySet()) {
				if (valueEntry.getValue() == null || valueEntry.getValue().isEmpty())
					continue;
				var existingPv = parameterValuesMap.get(valueEntry.getKey());
				if (existingPv != null)
					existingPv.value = valueEntry.getValue();
				else {
					var pv = new LocationParameterValue();
					pv.definition = em.find(LocationParameterDefinition.class, valueEntry.getKey());
					pv.entry = entry;
					pv.value = valueEntry.getValue();
					entry.parameterValues.add(pv);
					em.persist(pv);
				}
			}
		}
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

	private EmQuery<InventoryEntry> buildQuery(Long locationId, Map<Long, String> parameterValues, Integer maxCount) {
		return new EmQuery<>(em, InventoryEntry.class) {
			{
				if (locationId != null) {
					where.add(cb.equal(root.get(InventoryEntry_.location).get(Location_.id), locationId));
				}

				if (parameterValues != null) {
					for (var valueEntry : parameterValues.entrySet()) {
						if (valueEntry.getValue() == null || valueEntry.getValue().isEmpty())
							continue;
						new EmSubQuery<>(LocationParameterValue.class) {
							{
								where.add(cb.equal(subFrom.get(LocationParameterValue_.definition)
										.get(LocationParameterDefinition_.id), valueEntry.getKey()));
								where.add(cb.equal(subFrom.get(LocationParameterValue_.value), valueEntry.getValue()));
								where.add(cb.equal(subFrom.get(LocationParameterValue_.entry), root));
							}
						}.whereExists();
					}
				}
				if (maxCount != null)
					setMaxResults(maxCount);
			}
		};
	}
}
