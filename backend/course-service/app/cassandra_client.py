import os
import logging
from cassandra.cluster import Cluster
from cassandra.util import uuid_from_time

logger = logging.getLogger(__name__)

cluster = None
session = None


def get_session():
    global cluster, session
    if session:
        return session

    host = os.getenv("CASSANDRA_HOST", "cassandra")
    port = int(os.getenv("CASSANDRA_PORT", 9042))
    keyspace = os.getenv("CASSANDRA_KEYSPACE", "ent")

    try:
        cluster = Cluster([host], port=port)
        session = cluster.connect()
        logger.info(f"Connected to Cassandra at {host}:{port}")
        return session
    except Exception as e:
        logger.error(f"Failed to connect to Cassandra: {e}")
        raise


def _ensure_schema():
    s = get_session()

    cql_keyspace = f"""
    CREATE KEYSPACE IF NOT EXISTS ent
      WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': 1}};
    """
    s.execute(cql_keyspace)
    logger.info("Ensured keyspace exists")

    s.set_keyspace('ent')

    cql = """
    CREATE TABLE IF NOT EXISTS courses (
        course_id UUID PRIMARY KEY,
        course_code TEXT,
        course_name TEXT,
        description TEXT,
        teacher_id TEXT,
        teacher_name TEXT,
        semester INT,
        academic_year TEXT,
        credits INT,
        created_date TIMESTAMP
    );
    """
    s.execute(cql)
    logger.info("Ensured courses table exists")


def init_db():
    _ensure_schema()
