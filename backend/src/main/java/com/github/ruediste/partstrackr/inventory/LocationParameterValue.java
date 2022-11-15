package com.github.ruediste.partstrackr.inventory;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import com.github.ruediste.partstrackr.location.LocationParameterDefinition;
import com.github.ruediste.partstrackr.parameter.ParameterValueBase;

@Entity
public class LocationParameterValue extends ParameterValueBase {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@ManyToOne(optional = false)
	public InventoryEntry entry;

	@ManyToOne(optional = false)
	public LocationParameterDefinition definition;
}
