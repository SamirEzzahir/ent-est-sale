#!/usr/bin/env python3
"""Verify that all required services are running and accessible."""

import subprocess
import time
import sys
from cassandra.cluster import Cluster
from minio import Minio

def check_cassandra():
    """Check if Cassandra is running and accessible."""
    print("Checking Cassandra...", end=" ")
    try:
        cluster = Cluster(["localhost"], port=9042, connect_timeout=5)
        session = cluster.connect()
        session.execute("SELECT now() FROM system.local;")
        session.shutdown()
        cluster.shutdown()
        print("✓ OK")
        return True
    except Exception as e:
        print(f"✗ FAILED: {str(e)}")
        return False

def check_minio():
    """Check if MinIO is running and accessible."""
    print("Checking MinIO...", end=" ")
    try:
        client = Minio(
            "localhost:9000",
            access_key="minioadmin",
            secret_key="minioadmin",
            secure=False
        )
        client.bucket_exists("test")
        print("✓ OK")
        return True
    except Exception as e:
        print(f"✗ FAILED: {str(e)}")
        return False

def main():
    """Run all checks."""
    print("\n=== SERVICE VERIFICATION ===\n")
    
    cassandra_ok = check_cassandra()
    minio_ok = check_minio()
    
    print("\n" + "="*30)
    
    if cassandra_ok and minio_ok:
        print("✓ ALL SERVICES READY!")
        print("\nYou can now run:")
        print("  uvicorn main:app --reload --port 8002")
        return 0
    else:
        print("\n✗ SOME SERVICES NOT READY\n")
        
        if not cassandra_ok:
            print("To start Cassandra:")
            print("  docker run -d --name cassandra -p 9042:9042 cassandra:4.1")
            print("  (Wait 30-40 seconds for startup)\n")
        
        if not minio_ok:
            print("To start MinIO:")
            print("  docker run -d --name minio -p 9000:9000 -p 9001:9001 ^")
            print("    -e MINIO_ROOT_USER=minioadmin ^")
            print("    -e MINIO_ROOT_PASSWORD=minioadmin ^")
            print("    minio/minio server /data --console-address \":9001\"\n")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())
