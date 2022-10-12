package com.github.ruediste.partstrackr;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Component;

@Component
public class EmHelper {

	@PersistenceContext
	private EntityManager em;

}
