-- CreateTable
CREATE TABLE "rag_index_record" (
    "articleId" UUID NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_index_record_pkey" PRIMARY KEY ("articleId")
);
