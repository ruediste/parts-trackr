package com.github.ruediste.partstrackr.part;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.github.ruediste.partstrackr.Pair;
import com.github.ruediste.partstrackr.document.Document;
import com.github.ruediste.partstrackr.document.Document_;
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

	@Lob
	public String comment;

	@OneToMany(mappedBy = PartParameterDefinition_.PART, fetch = FetchType.LAZY)
	public Set<PartParameterDefinition> parameterDefinitions = new HashSet<>();

	@OneToMany(mappedBy = PartParameterValue_.PART, fetch = FetchType.LAZY)
	public Set<PartParameterValue> parameterValues = new HashSet<>();

	@OneToMany(mappedBy = InventoryEntry_.PART, fetch = FetchType.LAZY)
	public Set<InventoryEntry> inventoryEntries = new HashSet<>();

	@OneToMany(mappedBy = Document_.PART, fetch = FetchType.LAZY)
	public Set<Document> documents = new HashSet<>();

	@ManyToOne
	public PartParameterDefinition childNameParameterDefinition;

	public static Comparator<Part> COMPARE_BY_NAME = Comparator.comparing(x -> x.name);

	public List<Part> pathIncludingSelf() {
		var tmp = ancestorsIncludingSelf();
		Collections.reverse(tmp);
		return tmp;
	}

	public List<Part> ancestorsIncludingSelf() {
		List<Part> result = new ArrayList<>();
		Part p = this;
		while (p != null) {
			result.add(p);
			p = p.parent;
		}
		return result;
	}

	public List<Part> pathExcludingSelf() {
		var tmp = ancestorsExcludingSelf();
		Collections.reverse(tmp);
		return tmp;
	}

	public List<Part> ancestorsExcludingSelf() {
		List<Part> result = new ArrayList<>();
		Part p = this.parent;
		while (p != null) {
			result.add(p);
			p = p.parent;
		}
		return result;
	}

	public Map<PartParameterDefinition, PartParameterValue> parameterMap() {
		return parameterValues.stream().collect(Collectors.toMap(x -> x.definition, x -> x));
	}

	public List<Pair<PartParameterDefinition, PartParameterValue>> getAllParameters() {
		return getAllParameterMap().entrySet().stream().sorted(Comparator.comparing(e -> e.getKey().name))
				.map(e -> Pair.of(e.getKey(), e.getValue())).toList();
	}

	public Map<PartParameterDefinition, PartParameterValue> getAllParameterMap() {
		Map<PartParameterDefinition, PartParameterValue> map = new HashMap<>();
		for (Part p : pathIncludingSelf()) {
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

		return parameterValue(definition);
	}

	public String parameterValue(PartParameterDefinition definition) {
		var value = getAllParameterMap().get(definition);

		if (value == null)
			return null;
		else
			return value.value;
	}

	public String calculateName() {
		var nameParameterDefinition = nameParameterDefinition();
		if (nameParameterDefinition != null) {
			var value = parameterValue(nameParameterDefinition);
			if (value != null)
				return nameParameterDefinition.format(value);
		}
		return name;
	}

	public Comparator<Part> childrenComparator() {
		return childrenComparator(this);
	}

	public static Comparator<Part> childrenComparator(Part parent) {
		if (parent != null && parent.childNameParameterDefinition != null) {
			return Comparator.comparing(child -> child.nameParameterValue(),
					parent.childNameParameterDefinition.comparator());
		} else {
			return Comparator.comparing(x -> x.name, Comparator.nullsLast(Comparator.naturalOrder()));
		}
	}

	public Optional<Document> primaryPhoto() {
		return documents.stream().filter(x -> x.primaryPhoto).findFirst();
	}

	public String parameterValuesDescription() {
		return parameterValues.stream().sorted(Comparator.comparing(x -> x.definition.name))
				.map(x -> x.definition.name + ": " + x.definition.format(x.value)).collect(Collectors.joining((", ")));
	}
}
