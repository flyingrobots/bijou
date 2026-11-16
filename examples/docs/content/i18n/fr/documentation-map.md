# Documentation de Bijou

| Surface | Rôle |
| :--- | :--- |
| [README du projet](../README.md) | Porte d’entrée publique |
| [Livre d’apprentissage](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf) | Construire et tester le moniteur de tâches |
| [Archive de conception](./book/bijou-archive.pdf) | Archives de conception historiques |
| [Édition complète](./book/bijou-designs.pdf) | Collection pédagogique et historique figée |

[Lisez le livre d’apprentissage](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf), consultez
l’[Archive de conception](./book/bijou-archive.pdf) ou
[lisez le livre complet](./book/bijou-designs.pdf).
Voir [les sources LaTeX et les détails de l’édition](./book/README.md).

Le livre d’apprentissage suit un moniteur de tâches à travers cinq parties : pourquoi Bijou, la construction
de l’application, la compréhension de ses mécanismes, sa fiabilisation, puis sa livraison
et sa maintenance. Il comprend des documents de référence pratiques et l’atlas des composants.

L’archive préserve 426 guides, principes, archives de conception,
notes de version, audits et rétrospectives sous forme d’annexes historiques. Leurs affirmations
et statuts d’origine n’ont pas été reclassés comme garanties d’implémentation actuelles.
L’édition complète préserve la publication combinée du 20 octobre 2026. Le livre
d’apprentissage vivant et ses sources LaTeX appartiennent désormais au dépôt job-monitor.
Les fichiers Markdown sources individuels restent supprimés ;
leur texte exact et leurs empreintes subsistent dans le corpus figé pour DOGFOOD et les vérifications.

Pour un extrait de source borné, exécutez depuis la racine du dépôt :

```bash
node --import tsx scripts/read-documentation.ts docs/ARCHITECTURE.md 1 80
```

Les arguments sont le chemin d’origine, la première ligne et la limite de lignes (250 au maximum).
`npm run docs:inventory` liste les documents d’exploitation et les artefacts du livre conservés.

Commencez par la préface et la page de version du livre d’apprentissage. Chaque partie
pédagogique comporte une introduction et un objectif d’apprentissage concret. Les sept ateliers utilisent le
[dépôt compagnon publié](https://github.com/flyingrobots/bijou-job-monitor) distinct,
épinglé à Bijou 7.2.0 pour l’édition `book-v2`. Cinq étapes de construction indépendantes, de vrais
diffs de sources et un corrigé commenté des exercices accompagnent les ateliers. La
relecture guidée par un humain est prête ; l’utilisateur organisera la lecture par un lecteur novice.
Le glossaire et l’index thématique facilitent la consultation pratique.

## Premiers pas

- [Construire votre première application Bijou](./guides/getting-started.md) : application minimale, paquets, mises en page et contrôles de DOGFOOD.
- [Tutoriel Job Monitor](https://github.com/flyingrobots/bijou-job-monitor) : une application complète et le livre d’apprentissage.
- [Développer Bijou](./development.md) : chaîne d’outils, tests, localisation et processus de contribution.

## Références d’exploitation actuelles

- [Dernières fonctionnalités dans DOGFOOD](../examples/docs/content/guides-latest-features.md)
- [Guide du paquet MCP](../examples/docs/content/package-mcp.md)
- [Porte d’entrée du projet](../README.md)
- [Accords des agents](../AGENTS.md)
- [Vocabulaire de conception](./topics/design-vocabulary.md) : termes canoniques, champs des familles de composants et style rédactionnel
- [Normes de code TypeScript](./typescript-code-standards.editors-edition.md)
- [Exceptions et dette Code Dojo](./code-dojo-exceptions.md)
- [Journal des modifications](./CHANGELOG.md)
- [Rejeu du témoin produit V8](./releases/8.0.0/product-witness-replay.md)
- [Dossier d’acceptation stable V8](./releases/8.0.0/stable-acceptance.md)
- [Tutoriel d’application encadrée](./guides/framed-app-tutorial.md)

Les issues et jalons GitHub définissent le périmètre actuel. Les propositions historiques du livre
conservent leur statut d’origine. La migration vers Linear nécessite encore une équipe connectée.

`npm run release:readiness -- --milestone v8.0.0` exige un dossier de publication
vivant à `docs/releases/8.0.0/stable-acceptance.md` ou au chemin hérité `README.md`
dans ce répertoire. Un dossier archivé reste disponible pour une lecture
historique, mais ne peut pas satisfaire la vérification actuelle des preuves de publication. Le rapport nomme
le dossier vivant qu’il a trouvé ; sa présence ne dispense pas d’examiner ses preuves.

DOGFOOD signale ses articles issus de l’archive comme références historiques. Son guide vivant
Latest Features couvre les travaux ultérieurs sur les polices, la typographie, l’animation et les thèmes ;
les README des paquets et les exemples exécutables fournissent les contrats actuels détaillés.

Les chemins des documents de publication suivent la ligne de version : `8.0.0-alpha.1`, `8.0.0-beta.12`,
`8.0.0-rc.1` et la version stable `8.0.0` partagent `docs/releases/8.0.0/`. Le jalon
de préparation est `v8.0.0` ; DOGFOOD utilise le même répertoire pour ses guides de publication.
Les préversions conservent leur version exacte dans le contenu des documents, sans dupliquer
le répertoire. Les documents historiques préservés restent accessibles via la
commande de lecture bornée ci-dessus.
