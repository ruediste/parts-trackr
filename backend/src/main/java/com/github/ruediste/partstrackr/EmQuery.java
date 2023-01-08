package com.github.ruediste.partstrackr;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import javax.persistence.criteria.Subquery;

import com.github.ruediste.partstrackr.inventory.LocationParameterValue;

public class EmQuery<T> {
	protected CriteriaBuilder cb;
	protected CriteriaQuery<T> q;
	protected Root<T> root;
	protected List<Predicate> where = new ArrayList<>();
	private TypedQuery<T> typedQuery;
	private EntityManager em;

	public EmQuery(EntityManager em, Class<T> cls) {
		this.em = em;
		cb = em.getCriteriaBuilder();
		q = cb.createQuery(cls);
		root = q.from(cls);
	}

	protected TypedQuery<T> typedQuery() {
		if (typedQuery == null) {
			q.where(where.toArray(new Predicate[where.size()]));
			typedQuery = em.createQuery(q);
		}
		return typedQuery;
	}

	protected void setMaxResults(int maxResults) {
		typedQuery().setMaxResults(maxResults);
	}

	public List<T> getResultList() {
		return typedQuery().getResultList();
	}

	public class EmSubQuery<TSub> {
		protected Subquery<LocationParameterValue> subQ;
		protected Root<LocationParameterValue> subFrom;
		protected List<Predicate> where = new ArrayList<>();

		public EmSubQuery(Class<TSub> subCls) {
			subQ = q.subquery(LocationParameterValue.class);
			subFrom = subQ.from(LocationParameterValue.class);
			subQ.select(subFrom);
		}

		public void whereExists() {
			subQ.where(where.toArray(new Predicate[where.size()]));
			EmQuery.this.where.add(cb.exists(subQ));
		}
	}
}