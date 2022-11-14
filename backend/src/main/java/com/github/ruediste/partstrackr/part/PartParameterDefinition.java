package com.github.ruediste.partstrackr.part;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.github.ruediste.partstrackr.parameter.ParameterDefinitionBase;

@Entity
public class PartParameterDefinition extends ParameterDefinitionBase {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@JsonIgnore
	@ManyToOne
	public Part part;
}
