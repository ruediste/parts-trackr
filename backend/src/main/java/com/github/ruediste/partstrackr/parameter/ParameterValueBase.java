package com.github.ruediste.partstrackr.parameter;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;

@MappedSuperclass
public class ParameterValueBase {

	@Column(length = 2000)
	public String value;
}
