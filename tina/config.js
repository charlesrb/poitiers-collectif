import { defineConfig } from "@tinacms/cli";

export default defineConfig({
  branch: "main", // Votre branche Git principale
  clientId: process.env.TINA_CLIENT_ID, // À obtenir sur tina.io
  token: process.env.TINA_TOKEN, // À obtenir sur tina.io

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },

  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },

  schema: {
    collections: [
      // Collection pour les articles/actualités
      {
        name: "posts",
        label: "Articles",
        path: "content/posts",
        format: "md",
        match: {
          include: "**/*.md",
        },
        ui: {
          router: ({ document }) => {
            // Extrait l'année et le nom du fichier du chemin
            const pathParts = document._sys.relativePath.split('/');
            const year = pathParts[0];
            const filename = document._sys.filename;
            return `/posts/${year}/${filename}`;
          },
          filename: {
            // Organise automatiquement par année
            slugify: (values) => {
              const year = new Date(values?.date || new Date()).getFullYear();
              return `${year}/${values?.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') || 'nouveau-article'}`;
            },
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titre",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
            ui: {
              dateFormat: "DD/MM/YYYY",
              timeFormat: "HH:mm",
            },
          },
          {
            type: "string",
            name: "categories",
            label: "Catégories",
            list: true,
            options: [
              { value: "actualites", label: "Actualités" },
              { value: "urbanisme", label: "Urbanisme" },
              { value: "environnement", label: "Environnement" },
              { value: "social", label: "Social" },
              { value: "democratie", label: "Démocratie" },
              { value: "mobilite", label: "Mobilité" },
              { value: "culture", label: "Culture" },
              { value: "compte-rendu", label: "Compte-rendu" },
            ],
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
          },
          {
            type: "string",
            name: "summary",
            label: "Résumé",
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "image",
            label: "Image d'illustration",
          },
          {
            type: "string",
            name: "author",
            label: "Auteur",
            options: [
              "Poitiers Collectif",
              "Bureau PC",
              "Commission Urbanisme",
              "Commission Environnement",
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenu",
            isBody: true,
            templates: [
              {
                name: "highlight",
                label: "Encadré Important",
                fields: [
                  {
                    type: "string",
                    name: "title",
                    label: "Titre",
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Contenu",
                  },
                ],
              },
              {
                name: "quote",
                label: "Citation",
                fields: [
                  {
                    type: "string",
                    name: "text",
                    label: "Citation",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "string",
                    name: "author",
                    label: "Auteur",
                  },
                ],
              },
            ],
          },
        ],
      },
      
      // Collection pour les événements
      {
        name: "events",
        label: "Événements",
        path: "content/events",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titre",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date de l'événement",
            required: true,
          },
          {
            type: "string",
            name: "location",
            label: "Lieu",
          },
          {
            type: "string",
            name: "type",
            label: "Type d'événement",
            options: [
              "Réunion publique",
              "Assemblée générale",
              "Manifestation",
              "Conférence",
              "Atelier",
            ],
          },
          {
            type: "rich-text",
            name: "body",
            label: "Description",
            isBody: true,
          },
        ],
      },

      // Collection pour les pages statiques
      {
        name: "pages",
        label: "Pages",
        path: "content",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "*.md",
          exclude: "{posts,events}/**",
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titre",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenu",
            isBody: true,
          },
        ],
      },
    ],
  },

  // Configuration de recherche
  search: {
    tina: {
      indexerToken: process.env.TINA_SEARCH_TOKEN,
      stopwordLanguages: ["fra"],
    },
    indexBatchSize: 100,
    maxSearchIndexFieldLength: 100,
  },
});