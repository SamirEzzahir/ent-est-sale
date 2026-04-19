import os
import logging

logger = logging.getLogger(__name__)

cassandra_host = os.getenv("CASSANDRA_HOST", "cassandra")
cassandra_port = int(os.getenv("CASSANDRA_PORT", "9042"))
cassandra_keyspace = os.getenv("CASSANDRA_KEYSPACE", "ent")

cluster = None
session = None


def _ensure_schema(sess) -> None:
    sess.execute(
        f"""
        CREATE KEYSPACE IF NOT EXISTS {cassandra_keyspace}
        WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': 1}}
        """
    )
    sess.set_keyspace(cassandra_keyspace)
    sess.execute(
        """
        CREATE TABLE IF NOT EXISTS course_files (
            id uuid PRIMARY KEY,
            filename text,
            course_name text,
            uploaded_by text,
            upload_date timestamp,
            minio_path text
        )
        """
    )


def get_session():
    """Lazy-load Cassandra session and create keyspace/table if needed."""
    global cluster, session

    if session is not None:
        return session

    try:
        from cassandra.cluster import Cluster

        cluster = Cluster([cassandra_host], port=cassandra_port)
        sess = cluster.connect()
        _ensure_schema(sess)
        session = sess
        logger.info("Connected to Cassandra at %s:%s", cassandra_host, cassandra_port)
        return session
    except Exception as e:
        logger.error("Failed to connect to Cassandra: %s", e)
        raise
