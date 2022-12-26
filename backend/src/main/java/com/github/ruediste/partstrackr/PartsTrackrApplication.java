package com.github.ruediste.partstrackr;

import java.io.File;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PartsTrackrApplication {

	public static void main(String[] args) {
		System.out.println("Working Directory: " + new File(".").getAbsolutePath());
		SpringApplication.run(PartsTrackrApplication.class, args);
	}

}
