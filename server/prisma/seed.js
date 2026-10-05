// Seed mínimo para um banco novo (Neon ou local).
// Uso: npm run seed            → cria atividades e categorias de insumo básicas (idempotente)
//      ADMIN_EMAIL=voce@x.com npm run seed → também promove esse usuário (já cadastrado) a ADMIN
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ATIVIDADES = [
  { nome: 'Rega', descricao: 'Irrigação do substrato até drenar pelos furos do vaso.' },
  { nome: 'Adubação', descricao: 'Aplicação de fertilizante orgânico ou químico.' },
  { nome: 'Poda de manutenção', descricao: 'Remoção de brotos para manter a silhueta.' },
  { nome: 'Poda estrutural', descricao: 'Remoção de galhos grandes para definir o design.' },
  { nome: 'Desfolha', descricao: 'Retirada parcial ou total das folhas para reduzir o tamanho e aumentar a ramificação.' },
  { nome: 'Aramação', descricao: 'Aplicação de arame para posicionar galhos e tronco.' },
  { nome: 'Desaramação', descricao: 'Remoção do arame antes que marque a casca.' },
  { nome: 'Transplante', descricao: 'Troca de vaso e/ou substrato, com poda de raízes.' },
  { nome: 'Tratamento fitossanitário', descricao: 'Controle de pragas e doenças.' },
  { nome: 'Revisão geral', descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' },
];

const TIPOS_RECURSO = ['Adubo', 'Substrato', 'Arame', 'Defensivo', 'Pasta cicatrizante'];

async function main() {
  for (const atividade of ATIVIDADES) {
    await prisma.atividade.upsert({ where: { nome: atividade.nome }, update: {}, create: atividade });
  }
  for (const nome of TIPOS_RECURSO) {
    await prisma.tipoRecurso.upsert({ where: { nome }, update: {}, create: { nome } });
  }
  console.log(`Seed: ${ATIVIDADES.length} atividades e ${TIPOS_RECURSO.length} tipos de recurso garantidos.`);

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const result = await prisma.usuario.updateMany({ where: { email: adminEmail }, data: { role: 'ADMIN' } });
    console.log(
      result.count
        ? `Usuário ${adminEmail} promovido a ADMIN.`
        : `Nenhum usuário com e-mail ${adminEmail} — cadastre-se no site e rode o seed de novo.`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
