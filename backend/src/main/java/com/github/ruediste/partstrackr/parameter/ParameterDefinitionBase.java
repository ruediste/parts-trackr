package com.github.ruediste.partstrackr.parameter;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.ElementCollection;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.MappedSuperclass;

@MappedSuperclass()
public class ParameterDefinitionBase {

	public String name;
	@Enumerated(EnumType.STRING)
	public ParameterType type;
	@Enumerated(EnumType.STRING)
	public Unit unit;

	@ElementCollection(fetch = FetchType.EAGER)
	public List<String> choiceValues = new ArrayList<>();
}
