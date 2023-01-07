package com.github.ruediste.partstrackr.part;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Component;

@Component
public class PartService {
	@PersistenceContext
	EntityManager em;

	public List<Part> getRootParts() {
		var cb = em.getCriteriaBuilder();
		var q = cb.createQuery(Part.class);
		var part = q.from(Part.class);
		q.select(part);
		q.where(cb.isNull(part.get(Part_.parent)));
		return em.createQuery(q).getResultList();
	}
}
