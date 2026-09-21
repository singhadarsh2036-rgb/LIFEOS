package com.lifeos.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Service
public class IgnavFlightService {

    private final HttpClient httpClient;

    @Value("${ignav.api-key:}")
    private String apiKey;

    public IgnavFlightService() {
        this.httpClient = HttpClient.newHttpClient();
    }

    public String searchFlights(
            String origin,
            String destination,
            String departureDate,
            String returnDate,
            int travelers
    ) throws Exception {

        boolean roundTrip =
                returnDate != null &&
                !returnDate.isBlank();

        String endpoint = roundTrip
                ? "https://ignav.com/api/fares/round-trip"
                : "https://ignav.com/api/fares/one-way";

        StringBuilder json = new StringBuilder();

        json.append("{")
                .append("\"origin\":\"").append(origin).append("\",")
                .append("\"destination\":\"").append(destination).append("\",")
                .append("\"departure_date\":\"").append(departureDate).append("\",")
                .append("\"adults\":").append(travelers).append(",")
                .append("\"cabin_class\":\"economy\",")
                .append("\"market\":\"IN\"");

        if (roundTrip) {
            json.append(",")
                    .append("\"return_date\":\"")
                    .append(returnDate)
                    .append("\"");
        }

        json.append("}");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("X-Api-Key", apiKey)
                .header("Content-Type", "application/json")
                .POST(
                        HttpRequest.BodyPublishers.ofString(
                                json.toString()
                        )
                )
                .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200 ||
            response.statusCode() >= 300) {

            throw new RuntimeException(
                    "Ignav API error: "
                            + response.statusCode()
                            + " - "
                            + response.body()
            );
        }

        return response.body();
    }

    public String searchAirports(String query) throws Exception {

        String encodedQuery = URLEncoder.encode(
                query,
                StandardCharsets.UTF_8
        );

        String endpoint =
                "https://ignav.com/api/airports?q="
                        + encodedQuery
                        + "&limit=8";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("X-Api-Key", apiKey)
                .GET()
                .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200 ||
            response.statusCode() >= 300) {

            throw new RuntimeException(
                    "Ignav Airport API error: "
                            + response.statusCode()
                            + " - "
                            + response.body()
            );
        }

        return response.body();
    }

    // Get real booking options for a selected flight
    public String getBookingLinks(String ignavId) throws Exception {

        String endpoint =
                "https://ignav.com/api/fares/booking-links";

        String json = "{"
                + "\"ignav_id\":\""
                + ignavId
                + "\""
                + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("X-Api-Key", apiKey)
                .header("Content-Type", "application/json")
                .POST(
                        HttpRequest.BodyPublishers.ofString(
                                json
                        )
                )
                .build();

        HttpResponse<String> response =
                httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        if (response.statusCode() < 200 ||
            response.statusCode() >= 300) {

            throw new RuntimeException(
                    "Ignav booking links error: "
                            + response.statusCode()
                            + " - "
                            + response.body()
            );
        }

        return response.body();
    }
}