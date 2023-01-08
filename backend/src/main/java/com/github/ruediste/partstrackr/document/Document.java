package com.github.ruediste.partstrackr.document;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.github.ruediste.partstrackr.part.Part;

@Entity
@Table(indexes = { @Index(columnList = Document_.NAME + "," + Document_.PART + "_id", unique = true) })
public class Document {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	public long id;

	public String name;

	@JsonIgnore
	@ManyToOne
	public Part part;

	public String mimeType;

	public String fileName;

	public boolean primaryPhoto;
}
