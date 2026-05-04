-- CreateTable: face_descriptors with pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "face_descriptors" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "descriptor" vector(128) NOT NULL,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_descriptors_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "face_descriptors" ADD CONSTRAINT "face_descriptors_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: IVFFlat for fast approximate nearest neighbor search
CREATE INDEX ON "face_descriptors" USING ivfflat (descriptor vector_l2_ops) WITH (lists = 100);
