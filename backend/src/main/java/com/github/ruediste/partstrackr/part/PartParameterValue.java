package com.github.ruediste.partstrackr.part;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import com.github.ruediste.partstrackr.parameter.ParameterValueBase;

@Entity
public class PartParameterValue extends ParameterValueBase {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@ManyToOne(optional = false)
	public Part part;

	@ManyToOne(optional = false)
	public PartParameterDefinition definition;
}
