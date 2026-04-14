import os
import logging

logger = logging.getLogger(__name__)

cassandra_host = os.getenv("CASSANDRA_HOST", "cassandra")
cassandra_port = int(os.getenv("CASSANDRA_PORT", "9042"))
cassandra_keyspace = os.getenv("CASSANDRA_KEYSPACE", "ent")

cluster = None
session = None


def get_session():
    global cluster, session

    if session is not None:
        return session

    try:
        from cassandra.cluster import Cluster

        cluster = Cluster([cassandra_host], port=cassandra_port)
        session = cluster.connect(cassandra_keyspace)
        logger.info(f"Connected to Cassandra at {cassandra_host}:{cassandra_port}")
        return session
    except Exception as e:
        logger.error(f"Failed to connect to Cassandra: {str(e)}")
        raise
