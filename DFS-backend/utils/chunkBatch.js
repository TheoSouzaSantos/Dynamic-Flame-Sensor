const CHUNK_SIZE = 499;

/**
 * Comita uma lista de operações de escrita em múltiplos `batch`es do
 * Firestore, no máximo `CHUNK_SIZE` (499) por batch — o limite real é 500,
 * mas fica uma margem para quem precisa somar mais uma escrita no último
 * chunk (ex.: apagar o documento pai junto com seus filhos).
 *
 * Os chunks são comitados em sequência (não em paralelo): o Firestore não
 * tem transação entre batches, então não há atomicidade a ganhar
 * paralelizando, e committar em sequência deixa o comportamento em caso de
 * falha parcial mais simples de entender.
 * @param {FirebaseFirestore.Firestore} db
 * @param {Array<(batch: FirebaseFirestore.WriteBatch) => void>} operacoes
 */
const commitEmChunks = async (db, operacoes) => {
    for (let i = 0; i < operacoes.length; i += CHUNK_SIZE) {
        const batch = db.batch();
        operacoes.slice(i, i + CHUNK_SIZE).forEach((operacao) => operacao(batch));
        await batch.commit();
    }
};

module.exports = commitEmChunks;
