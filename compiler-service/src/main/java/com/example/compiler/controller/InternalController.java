package com.example.compiler.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal")
public class InternalController {

    @Value("${compiler.testcases.dir}")
    private String testCasesDir;

    @PostMapping("/testcases/{questionId}")
    public ResponseEntity<Void> saveTestCases(@PathVariable Long questionId,
            @RequestBody List<Map<String, String>> testCases) {
        String hiddenDir = testCasesDir + "/" + questionId + "/hidden";
        File dir = new File(hiddenDir);

        if (dir.exists()) {
            // Clean up existing hidden cases for this question
            File[] existing = dir.listFiles();
            if (existing != null) {
                for (File f : existing)
                    f.delete();
            }
        } else {
            dir.mkdirs();
        }

        for (int i = 0; i < testCases.size(); i++) {
            Map<String, String> tc = testCases.get(i);
            String input = tc.get("input");
            String output = tc.get("output");

            try {
                Files.writeString(Paths.get(hiddenDir, "in_" + (i + 1) + ".txt"), input != null ? input : "");
                Files.writeString(Paths.get(hiddenDir, "out_" + (i + 1) + ".txt"), output != null ? output : "");
            } catch (IOException e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().build();
            }
        }

        return ResponseEntity.ok().build();
    }
}
