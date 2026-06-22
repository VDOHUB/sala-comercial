// ─────────────────────────────────────────────────────────────────────────────
// FOTOS DA SALA — adicione aqui quando tiver novas imagens
//
// 1. Coloque o arquivo em:  public/sala/nome-do-arquivo.jpg
// 2. Adicione uma entrada abaixo com o mesmo nome no campo `src`
//
// Ordem aqui = ordem no slideshow
// heroPanel: true  → aparece também no painel do Hero (recomendado: 4 a 6 fotos)
// ─────────────────────────────────────────────────────────────────────────────

export type RoomPhoto = {
  id: number;
  src: string;          // caminho a partir de /public  ex: "/sala/foto-01.jpeg"
  label: string;        // legenda exibida no slideshow
  heroPanel?: boolean;  // aparece no painel do Hero (lado direito da tela inicial)
  // Gradiente exibido enquanto a foto não existir (fallback automático)
  fallback: string;
};

export const roomPhotos: RoomPhoto[] = [
  {
    id: 1,
    src: "/sala/foto-01.jpeg",
    label: "Vista geral da sala",
    heroPanel: true,
    fallback: "linear-gradient(135deg, #3d2010 0%, #5a3822 40%, #2a1608 100%)",
  },
  {
    id: 2,
    src: "/sala/foto-02.jpeg",
    label: "Mesa de reunião",
    heroPanel: true,
    fallback: "linear-gradient(160deg, #1e1108 0%, #3a2412 50%, #4d3218 100%)",
  },
  {
    id: 3,
    src: "/sala/foto-03.jpeg",
    label: "Ambiente climatizado",
    heroPanel: true,
    fallback: "linear-gradient(135deg, #2a1a0a 0%, #4a2e14 45%, #3d2010 100%)",
  },
  {
    id: 4,
    src: "/sala/foto-04.jpeg",
    label: "Detalhes da sala",
    heroPanel: true,
    fallback: "linear-gradient(150deg, #321e07 0%, #1a0e05 50%, #4d3015 100%)",
  },
  {
    id: 5,
    src: "/sala/foto-05.jpeg",
    label: "Comodidades",
    heroPanel: false,
    fallback: "linear-gradient(140deg, #1a0e05 0%, #3a2412 40%, #5a3822 100%)",
  },
  {
    id: 6,
    src: "/sala/foto-06.jpeg",
    label: "Espaço de trabalho",
    heroPanel: false,
    fallback: "linear-gradient(135deg, #2a1608 0%, #4d3015 100%)",
  },
  {
    id: 7,
    src: "/sala/foto-07.jpeg",
    label: "Área de atendimento",
    heroPanel: false,
    fallback: "linear-gradient(150deg, #1a0e05 0%, #3a2412 100%)",
  },
  {
    id: 8,
    src: "/sala/foto-08.jpeg",
    label: "Infraestrutura",
    heroPanel: false,
    fallback: "linear-gradient(140deg, #321e07 0%, #5a3822 100%)",
  },
];

// Fotos usadas no painel do Hero (filtragem automática)
export const heroPanelPhotos = roomPhotos.filter((p) => p.heroPanel);
