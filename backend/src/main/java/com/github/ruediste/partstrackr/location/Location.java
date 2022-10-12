package com.github.ruediste.partstrackr.location;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;

@Entity
public class Location {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	public String name;

	@OneToMany(mappedBy = LocationParameterDefinition_.LOCATION, fetch = FetchType.EAGER)
	public List<LocationParameterDefinition> parameterDefinitions = new ArrayList<>();
}
