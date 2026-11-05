#!/usr/bin/env python3
"""Dependency-free HTTP integration smoke checks for the Subapp 2 development API.

Run only against a disposable, seeded Development instance. This script performs
real writes and deletes its created challenge at the end. It is not a unit-test
suite and is not intended to run against production.
"""

import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = os.environ.get("SPA_API_URL", "http://localhost:5116").rstrip("/")
DEMO_PASSWORD = os.environ.get("SPA_SMOKE_DEMO_PASSWORD", "Password123!")


def request(method, path, body=None, token=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"{BASE_URL}{path}", data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read()
            payload = json.loads(raw) if raw else None
            return response.status, payload
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            payload = json.loads(raw) if raw else None
        except ValueError:
            payload = None
        return error.code, payload


def expect(actual, wanted, scenario):
    if actual != wanted:
        raise AssertionError(
            f"{scenario}: expected HTTP {wanted}, got HTTP {actual}"
        )
    print(f"PASS: {scenario} (HTTP {actual})")


def login(username):
    status, result = request(
        "POST", "/api/auth/login",
        {"usernameOrEmail": username, "password": DEMO_PASSWORD}
    )
    expect(status, 200, f"Login as {username}")
    token = result.get("token") if isinstance(result, dict) else None
    if not token:
        raise AssertionError(f"Login as {username} did not return a token")
    return token


def main():
    status, challenges = request("GET", "/api/challenges?filter=All&searchTerm=")
    expect(status, 200, "Public challenge search")
    if not isinstance(challenges, list):
        raise AssertionError("Expected challenge JSON array")

    status, _ = request("GET", "/api/challenges/mine")
    expect(status, 401, "Anonymous challenge management rejected")

    alice = login("Alice")
    bob = login("Bob")

    invalid = {
        "title": "",
        "description": "Invalid empty title",
        "imageUrl": "",
        "timeLimitMinutes": 15,
        "showAnswersAfterCompletion": True,
        "isCore": True,
    }
    status, _ = request("POST", "/api/challenges", invalid, alice)
    expect(status, 400, "Server-side validation rejects invalid challenge")

    valid = {
        "title": "Automated SPA smoke challenge",
        "description": "Disposable challenge created by the integration smoke check.",
        "imageUrl": "",
        "timeLimitMinutes": 10,
        "showAnswersAfterCompletion": True,
        "isCore": True,
    }

    challenge_id = None
    try:
        status, created = request("POST", "/api/challenges", valid, alice)
        expect(status, 201, "Valid challenge creation")
        if not isinstance(created, dict):
            raise AssertionError("Create challenge did not return a DTO")
        challenge_id = created.get("challengeId")
        if not isinstance(challenge_id, int):
            raise AssertionError("Missing challenge ID in response")
        if created.get("isCore") is not False:
            raise AssertionError("Normal user must not be able to create Core challenge")

        status, _ = request(
            "POST", f"/api/challenges/{challenge_id}/publish", token=alice
        )
        expect(status, 400, "Cannot publish challenge without questions")

        status, _ = request(
            "PUT", f"/api/challenges/{challenge_id}",
            {**valid, "title": "Changed smoke challenge title", "isCore": False},
            bob,
        )
        expect(status, 403, "Other user cannot edit challenge")

        status, _ = request(
            "PUT", f"/api/challenges/{challenge_id}",
            {**valid, "title": "Changed smoke challenge title", "isCore": False},
            alice,
        )
        expect(status, 204, "Owner can update challenge")

        status, details = request(
            "GET", f"/api/challenges/{challenge_id}", token=alice
        )
        expect(status, 200, "Owner can read draft challenge")
        if details.get("title") != "Changed smoke challenge title":
            raise AssertionError("Updated challenge title was not persisted")
    finally:
        if challenge_id is not None:
            status, _ = request(
                "DELETE", f"/api/challenges/{challenge_id}", token=alice
            )
            expect(status, 204, "Owner can delete created challenge")

    print("SPA API integration smoke tests completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, urllib.error.URLError, ValueError, KeyError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
