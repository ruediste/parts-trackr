package com.github.ruediste.partstrackr.parameter;

import java.util.Set;

import javax.persistence.Column;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.MappedSuperclass;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@MappedSuperclass
public class ParameterDefinitionBase {

	public String name;
	@Enumerated(EnumType.STRING)

	public ParameterType type;

	@Enumerated(EnumType.STRING)
	public Unit unit;

	@JsonProperty
	@Column(length = 2000)
	private String choiceValues;

	public Set<String> getChoiceValues(ObjectMapper om) {
		try {
			return om.readValue(choiceValues, new TypeReference<Set<String>>() {
			});
		} catch (JsonProcessingException e) {
			throw new RuntimeException(e);
		}
	}

	public void setChoiceValues(Set<String> values, ObjectMapper om) {
		try {
			choiceValues = om.writeValueAsString(values);
		} catch (JsonProcessingException e) {
			throw new RuntimeException(e);
		}
	}

	public String format(String value) {
		if (type == ParameterType.VALUE) {
			var tmp = Double.parseDouble(value);
			var prefix = SiPrefix.get(tmp);
			if (prefix == null)
				return value + " " + unit.symbol;
			return (tmp / prefix.multiplier + prefix.symbol) + " " + unit.symbol;
		}
		return value;
	}
}
