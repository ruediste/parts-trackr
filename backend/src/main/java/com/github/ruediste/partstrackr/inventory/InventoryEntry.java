package com.github.ruediste.partstrackr.inventory;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

import com.github.ruediste.partstrackr.location.Location;
import com.github.ruediste.partstrackr.part.Part;

@Entity
public class InventoryEntry {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	@ManyToOne(optional = false)
	public Part part;

	@ManyToOne(optional = false)
	public Location location;

}
