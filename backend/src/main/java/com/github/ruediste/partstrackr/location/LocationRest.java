package com.github.ruediste.partstrackr.location;

import static java.util.stream.Collectors.toMap;

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

@Component
@Transactional
@Path("api/location")
@Produces(MediaType.APPLICATION_JSON)
public class LocationRest {

	@PersistenceContext
	private EntityManager em;

	@GET
	public List<Location> search(@QueryParam("name") String nameQuery) {
		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(Location.class);
		var location = q.from(Location.class);
		q.select(location);
		if (StringUtils.hasText(nameQuery))
			q.where(cb.like(location.get(Location_.name), "%" + nameQuery + "%"));
		return em.createQuery(q).getResultList();
	}

	@POST
	public Location add(Location newLocation) {
		em.persist(newLocation);
		for (var def : newLocation.parameterDefinitions) {
			def.location = newLocation;
			em.persist(def);
		}
		em.flush();
		return newLocation;
	}

	@GET
	@Path("{id}")
	public Location get(@PathParam("id") long id) {
		Location result = em.find(Location.class, id);
		return result;
	}

	@DELETE
	@Path("{id}")
	public void delete(@PathParam("id") long id) {
		em.remove(em.find(Location.class, id));
	}

	@POST
	@Path("{id}")
	public Location update(@PathParam("id") long id, Location newLocation) {
		newLocation.id = id;
		var location = em.find(Location.class, id);
		var existingLocations = new HashMap<>(location.parameterDefinitions.stream().collect(toMap(x -> x.id, x -> x)));
		em.merge(newLocation);
		for (var def : newLocation.parameterDefinitions) {
			def.location = location;
			if (def.id == 0)
				em.persist(def);
			else {
				em.merge(def);
				existingLocations.remove(def.id);
			}
		}
		existingLocations.values().forEach(def -> em.remove(def));
		return location;
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
		return em.merge(definition);
	}
}
