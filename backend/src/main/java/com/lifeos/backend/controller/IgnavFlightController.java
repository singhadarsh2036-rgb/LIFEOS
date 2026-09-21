package com.lifeos.backend.controller;

import com.lifeos.backend.service.IgnavFlightService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trips")
public class IgnavFlightController {

    private final IgnavFlightService ignavFlightService;

    public IgnavFlightController(IgnavFlightService ignavFlightService) {
        this.ignavFlightService = ignavFlightService;
    }

    @PostMapping("/flights/search")
    public ResponseEntity<String> searchFlights(
            @RequestBody FlightSearchRequest request
    ) {
        try {

            String results = ignavFlightService.searchFlights(
                    request.origin(),
                    request.destination(),
                    request.departureDate(),
                    request.returnDate(),
                    request.travelers()
            );

            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(results);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"message\":\"Could not search flights\"}");
        }
    }

    @GetMapping("/airports")
    public ResponseEntity<String> searchAirports(
            @RequestParam String query
    ) {
        try {

            String results =
                    ignavFlightService.searchAirports(query);

            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(results);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"message\":\"Could not search airports\"}");
        }
    }

    @PostMapping("/flights/booking-links")
    public ResponseEntity<String> getBookingLinks(
            @RequestBody BookingLinksRequest request
    ) {
        try {

            String results =
                    ignavFlightService.getBookingLinks(
                            request.ignavId()
                    );

            return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(results);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"message\":\"Could not get booking links\"}");
        }
    }

    public record FlightSearchRequest(
            String origin,
            String destination,
            String departureDate,
            String returnDate,
            int travelers
    ) {
    }

    public record BookingLinksRequest(
            String ignavId
    ) {
    }
}