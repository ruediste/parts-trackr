package com.github.ruediste.partstrackr.part;

import static java.util.stream.Collectors.toMap;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.github.ruediste.partstrackr.Pair;
import com.github.ruediste.partstrackr.inventory.InventoryEntry;
import com.github.ruediste.partstrackr.inventory.InventoryEntry_;

@Entity
public class Part {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@ManyToOne
	public Part parent;

	@JsonIgnore
	@OneToMany(mappedBy = Part_.PARENT)
	public Set<Part> children;

	public String name;

	@OneToMany(mappedBy = PartParameterDefinition_.PART, fetch = FetchType.EAGER)
	public Set<PartParameterDefinition> parameterDefinitions = new HashSet<>();

	@OneToMany(mappedBy = PartParameterValue_.PART, fetch = FetchType.EAGER)
	public Set<PartParameterValue> parameterValues = new HashSet<>();

	@OneToMany(mappedBy = InventoryEntry_.PART, fetch = FetchType.EAGER)
	public Set<InventoryEntry> inventoryEntries = new HashSet<>();

	@ManyToOne
	public PartParameterDefinition childNameParameterDefinition;

	public static Comparator<Part> COMPARE_BY_NAME = Comparator.comparing(x -> x.name);

	public List<Part> path() {
		var tmp = ancestors();
		Collections.reverse(tmp);
		return tmp;
	}

	public List<Part> ancestors() {
		List<Part> result = new ArrayList<>();
		Part p = this;
		while (p != null) {
			result.add(p);
			p = p.parent;
		}
		return result;
	}

	public Map<PartParameterDefinition, PartParameterValue> parameterMap() {
		return parameterValues.stream().collect(toMap(x -> x.definition, x -> x));
	}

	public List<Pair<PartParameterDefinition, PartParameterValue>> getAllParameters() {
		return getAllParameterMap().entrySet().stream().sorted(Comparator.comparing(e -> e.getKey().name))
				.map(e -> Pair.of(e.getKey(), e.getValue())).toList();
	}

	public Map<PartParameterDefinition, PartParameterValue> getAllParameterMap() {
		Map<PartParameterDefinition, PartParameterValue> map = new HashMap<>();
		for (Part p : path()) {
			p.parameterDefinitions.forEach(def -> map.put(def, null));
			p.parameterValues.forEach(value -> map.put(value.definition, value));
		}
		return map;
	}

	public boolean isNamedByChildNameParameter() {
		return nameParameterDefinition() != null;
	}

	public PartParameterDefinition nameParameterDefinition() {
		if (parent == null)
			return null;
		return parent.childNameParameterDefinition;
	}

	public String nameParameterValue() {
		var definition = nameParameterDefinition();
		if (definition == null)
			return null;

		var value = getAllParameterMap().get(definition);

		if (value == null)
			return null;
		else
			return value.value;
	}
}
