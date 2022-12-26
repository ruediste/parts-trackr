package com.github.ruediste.partstrackr.inventory;

import java.util.List;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;

import com.github.ruediste.partstrackr.location.Location;
import com.github.ruediste.partstrackr.part.Part;

@Entity
public class InventoryEntry {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@ManyToOne(optional = true)
	public Part part;

	@ManyToOne(optional = true)
	public Location location;

	@OneToMany(mappedBy = LocationParameterValue_.ENTRY)
	public List<LocationParameterValue> parameterValues;

	public int count;
}
