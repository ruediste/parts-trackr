package com.github.ruediste.partstrackr.location;

import java.util.ArrayList;
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

@Component
@Transactional
@Path("api/location")
@Produces(MediaType.APPLICATION_JSON)
public class LocationRest {

	public static class LocationPMod {
		public long id;
		public String name;
		public boolean addedByIncludeId;
	}

	@PersistenceContext
	private EntityManager em;

	@GET
	public List<LocationPMod> search(@QueryParam("name") String nameQuery, @QueryParam("maxCount") Integer maxCount,
			@QueryParam("includeId") Long includeId) {
		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(Location.class);
		var location = q.from(Location.class);
		q.select(location);
		if (StringUtils.hasText(nameQuery))
			q.where(cb.like(location.get(Location_.name), "%" + nameQuery + "%"));
		var typedQuery = em.createQuery(q);
		if (maxCount != null)
			typedQuery.setMaxResults(maxCount);
		var result = new ArrayList<>(typedQuery.getResultList().stream().map(this::toPMod).toList());

		if (includeId != null && !result.stream().anyMatch(l -> l.id == includeId)) {
			var tmp = em.find(Location.class, includeId);
			if (tmp != null) {
				var pMod = toPMod(tmp);
				pMod.addedByIncludeId = true;
				result.add(pMod);
			}
		}
		return result;
	}

	private LocationPMod toPMod(Location location) {
		if (location == null)
			return null;
		var pMod = new LocationPMod();
		pMod.id = location.id;
		pMod.name = location.name;
		return pMod;
	}

	private void update(Location location, LocationPMod pMod) {
		location.name = pMod.name;
	}

	@POST
	public LocationPMod add(LocationPMod pMod) {
		Location newLocation = new Location();
		update(newLocation, pMod);
		em.persist(newLocation);
		em.flush();
		return toPMod(newLocation);
	}

	@GET
	@Path("{id}")
	public LocationPMod get(@PathParam("id") long id) {
		return toPMod(em.find(Location.class, id));
	}

	@DELETE
	@Path("{id}")
	public void delete(@PathParam("id") long id) {
		em.remove(em.find(Location.class, id));
	}

	@POST
	@Path("{id}")
	public LocationPMod update(@PathParam("id") long id, LocationPMod newLocation) {
		var location = em.find(Location.class, id);
		update(location, newLocation);
		return toPMod(location);
	}

	@GET
	@Path("{id}/parameterDefinition")
	public List<LocationParameterDefinition> getParameterDefinitions(@PathParam("id") long id) {
		return em.find(Location.class, id).parameterDefinitions;
	}

	@POST
	@Path("{id}/parameterDefinition")
	public LocationParameterDefinition addParameterDefinitions(@PathParam("id") long id,
			LocationParameterDefinition definition) {
		definition.location = em.find(Location.class, id);
		definition.cleanup();
		em.persist(definition);
		em.flush();
		return definition;
	}

	@GET
	@Path("{id}/parameterDefinition/{definitionId}")
	public LocationParameterDefinition getParameterDefinition(@PathParam("definitionId") long definitionId) {
		return em.find(LocationParameterDefinition.class, definitionId);
	}

	@DELETE
	@Path("{id}/parameterDefinition/{definitionId}")
	public void deleteParameterDefinition(@PathParam("definitionId") long definitionId) {
		var definition = em.find(LocationParameterDefinition.class, definitionId);
		em.remove(definition);
	}

	@POST
	@Path("{id}/parameterDefinition/{definitionId}")
	public LocationParameterDefinition updateParameterDefinition(@PathParam("id") long id,
			@PathParam("definitionId") long definitionId, LocationParameterDefinition definition) {
		definition.id = definitionId;
		definition.location = em.find(Location.class, id);
		definition.cleanup();
		return em.merge(definition);
	}
}
