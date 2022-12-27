package com.github.ruediste.partstrackr.inventory;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.transaction.Transactional;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.stereotype.Component;

import com.github.ruediste.partstrackr.location.LocationParameterDefinition;

@Component
@Transactional
@Path("api/inventoryEntry")
@Produces(MediaType.APPLICATION_JSON)
public class InventoryItemRest {
	@PersistenceContext
	private EntityManager em;

	public static class LocationParameterValuePMod {
		public Long id;
		public LocationParameterDefinition definition;
		public String value;
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
