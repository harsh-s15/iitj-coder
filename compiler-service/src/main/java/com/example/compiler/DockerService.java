package com.example.compiler;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;

@Service
public class DockerService {

    @Value("${compiler.workdir}")
    private String workDirBase;

    @Value("${compiler.testcases.dir}")
    private String testCasesDirBase;

    public String runCode(String submissionId, String code, String questionId, String input, int timeLimit) {
        System.out.println("DockerService: starting runCode for submission " + submissionId + " (Hardcoded C++)");
        try {
            Path workDir = Paths.get(workDirBase, submissionId);
            Files.createDirectories(workDir);
            System.out.println("DockerService: workDir created at " + workDir.toAbsolutePath());

            String extension = "cpp";
            String compiler = "g++";

            String filename = "solution." + extension;
            // Write source code
            Files.writeString(workDir.resolve(filename), code);

            // Docker command (Simplified for C/GCC)
            String dockerCmd = String.format(
                    "docker run --rm -i --memory=128m --cpus=0.5 -v %s:/usr/src/app gcc:latest sh -c \"%s /usr/src/app/%s -o /usr/src/app/out && /usr/src/app/out\"",
                    workDir.toAbsolutePath().toString(), compiler, filename);

            System.out.println("DockerService: executing command: " + dockerCmd);

            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", dockerCmd);
            Process process = pb.start();

            // Background thread to swallow/log stderr to prevent hang
            StringBuilder errorLog = new StringBuilder();
            Thread errorThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        errorLog.append(line).append("\n");
                    }
                } catch (IOException e) {
                    System.err.println("Error reading stderr: " + e.getMessage());
                }
            });
            errorThread.start();

            // Write input to stdin
            if (input != null && !input.isEmpty()) {
                System.out.println("DockerService: writing input to stdin...");
                try (OutputStream os = process.getOutputStream()) {
                    os.write(input.getBytes());
                    os.flush();
                }
            }

            boolean finished = process.waitFor(timeLimit + 5000, TimeUnit.MILLISECONDS); // Added extra 5s for container
                                                                                         // overhead
            if (!finished) {
                System.out.println("DockerService: process TIMEOUT");
                process.destroyForcibly();
                return "TIMEOUT";
            }

            errorThread.join(1000);

            if (process.exitValue() != 0) {
                String error = errorLog.toString();
                System.out.println(
                        "DockerService: process failed with exit code " + process.exitValue() + ". Error: " + error);
                return "RUNTIME_ERROR\n" + error;
            }

            String result = new String(process.getInputStream().readAllBytes());
            System.out.println("DockerService: execution successful. Result length: " + result.length());
            return result;

        } catch (Exception e) {
            System.err.println("DockerService: SYSTEM_ERROR: " + e.getMessage());
            e.printStackTrace();
            return "SYSTEM_ERROR: " + e.getMessage();
        }
    }
}
