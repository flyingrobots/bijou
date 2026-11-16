---
title: "Aperçu des Blocks"
summary: "Un index d’aperçu adossé au code pour les Blocks standard, leurs variantes et les stories déclarées."
---
# Aperçu des Blocks

Sélectionnez un Block dans la navigation latérale pour voir son exemple TUI en direct, l’aperçu de son abaissement et sa documentation. La vue d’ensemble garde l’inventaire du paquet lisible sans afficher tous les Blocks à la fois.

## Blocks disponibles

## AppShell

Compose les régions logiques d’une application pour la navigation, le contenu, l’inspection, l’état et les superpositions.

Variantes : wide (Large), narrow (Étroit)

Stories :
- app-shell.ready - Shell prêt - ready
- app-shell.narrow - Shell étroit - narrow
- app-shell.overlay - Shell avec superposition - overlay

## ReaderSurface

Compose un contenu lisible avec un contexte facultatif de navigation et de plan.

Variantes : article (Article), loading (Chargement)

Stories :
- reader-surface.ready - Lecteur prêt - ready
- reader-surface.loading - Lecteur en chargement - loading
- reader-surface.stale - Lecteur périmé - stale
- reader-surface.empty - Lecteur vide - empty
- reader-surface.error - Lecteur en erreur - error

## InspectorPanel

Explique la sélection courante avec des faits et des actions sur la source facultatifs.

Variantes : selection (Sélection), empty (Vide)

Stories :
- inspector-panel.ready - Inspecteur prêt - ready
- inspector-panel.empty - Inspecteur vide - empty
- inspector-panel.loading - Inspecteur en chargement - loading
- inspector-panel.stale - Inspecteur périmé - stale
- inspector-panel.error - Inspecteur en erreur - error

## InlineStatusBlock

Associe des faits d’état concis aux libellés, aux lignes et aux indications de commande sans dépendre de la seule couleur pour le sens.

Variantes : ready (Prêt)

Stories :
- inline-status.ready - État en ligne prêt - ready

## InFlowStatusBlock

Affiche des messages d’état durables dans le flux avec gravité, source, action et faits en mode inférieur.

Variantes : ready (Prêt)

Stories :
- in-flow-status.ready - État dans le flux prêt - ready

## TransientOverlayBlock

Annonce un état éphémère avec des faits de priorité, de fermeture et de texte accessible.

Variantes : ready (Prêt)

Stories :
- transient-overlay.ready - Superposition éphémère prête - ready

## ActivityStreamBlock

Affiche des événements chronologiques avec l’événement sélectionné et des faits en mode inférieur.

Variantes : ready (Prêt)

Stories :
- activity-stream.ready - Flux d’activité prêt - ready

## ShortcutCueBlock

Affiche des indications de raccourci en ligne avec la touche, l’action, la portée et la sémantique en mode inférieur.

Variantes : ready (Prêt)

Stories :
- shortcut-cue.ready - Indication de raccourci prête - ready

## ProgressIndicatorBlock

Expose le libellé, la valeur, le total, le pourcentage et les faits de progression en mode inférieur.

Variantes : ready (Prêt)

Stories :
- progress-indicator.ready - Indicateur de progression prêt - ready

## FramedGroupBlock

Regroupe du contenu lié dans une région encadrée avec un titre, l’élément sélectionné et des faits de regroupement en mode inférieur.

Variantes : ready (Prêt)

Stories :
- framed-group.ready - Groupe encadré prêt - ready

## ExplainabilityWalkthroughBlock

Explique pourquoi un état a changé avec des faits d’étapes ordonnées, de preuves, de décision et d’action suivante.

Variantes : ready (Prêt)

Stories :
- explainability-walkthrough.ready - Explication pas à pas prête - ready

## FormattedDocumentBlock

Publie une prose persistante avec des faits de titre, de corps, d’encadré et de code qui survivent aux modes inférieurs.

Variantes : ready (Prêt)

Stories :
- formatted-document.ready - Document formaté prêt - ready

## LinkDestinationBlock

Décrit une destination navigable avec les faits de libellé, de cible, de type, d’état et de lien en mode inférieur.

Variantes : ready (Prêt)

Stories :
- link-destination.ready - Destination de lien prête - ready

## DividerBlock

Sépare les sections par un filet structurel étiqueté qui reste signifiant dans les modes `pipe` et `accessible`.

Variantes : ready (Prêt)

Stories :
- divider.ready - Séparateur prêt - ready

## TextEntryBlock

Décrit l’état d’une saisie de texte avec les faits de champ, de valeur, d’espace réservé, de validation et de résultat.

Variantes : ready (Prêt)

Stories :
- text-entry.ready - Saisie de texte prête - ready

## SingleChoiceBlock

Décrit un contrôle à choix unique avec les faits de liste d’options, de valeur sélectionnée, de mode et de validation.

Variantes : ready (Prêt)

Stories :
- single-choice.ready - Choix unique prêt - ready

## MultipleChoiceBlock

Décrit une liste de cases à cocher avec les faits cochés, non cochés, de résumé de la sélection et de validation.

Variantes : ready (Prêt)

Stories :
- multiple-choice.ready - Choix multiple prêt - ready

## BinaryDecisionBlock

Décrit une décision oui/non avec les faits de côté sélectionné, de conséquence, de confirmation et de motif de désactivation.

Variantes : ready (Prêt)

Stories :
- binary-decision.ready - Décision binaire prête - ready

## PeerNavigationBlock

Décrit la navigation entre éléments frères avec les faits précédent, courant, suivant, route et disponibilité.

Variantes : ready (Prêt)

Stories :
- peer-navigation.ready - Navigation entre pairs prête - ready

## ProgressiveDisclosureBlock

Décrit un contenu dépliable avec l’état de divulgation, le nombre d’éléments masqués, un résumé et des détails.

Variantes : ready (Prêt)

Stories :
- progressive-disclosure.ready - Divulgation progressive prête - ready

## PathProgressBlock

Décrit l’état d’un fil d’Ariane et d’une progression par étapes avec les faits de chemin, d’étape courante, d’ordinal, de total et d’état.

Variantes : ready (Prêt)

Stories :
- path-progress.ready - Progression du parcours prête - ready

## BrandEmphasisBlock

Décrit la mise en valeur de marque et décorative avec une sémantique explicite de décoration non essentielle.

Variantes : ready (Prêt)

Stories :
- brand-emphasis.ready - Mise en valeur de marque prête - ready

## ModeAwarePrimitiveBlock

Capture la sortie d’une primitive personnalisée avec des contrats de mode explicites et une sémantique fait/valeur.

Variantes : ready (Prêt)

Stories :
- mode-aware-primitive.ready - Primitive sensible au mode prête - ready

## DenseComparisonBlock

Publie des lignes de comparaison denses avec les faits de métrique, de valeur de gauche, de valeur de droite, d’écart et de ligne sélectionnée.

Variantes : ready (Prêt)

Stories :
- dense-comparison.ready - Comparaison dense prête - ready

## HierarchyBlock

Décrit l’état d’un arbre avec les faits de racine, de nœuds, de nœud sélectionné, de parent, de profondeur et de dépliage.

Variantes : ready (Prêt)

Stories :
- hierarchy.ready - Hiérarchie prête - ready

## ExplorationListBlock

Combine titre, facette, éléments, élément sélectionné et détail d’aperçu en un Block de navigation.

Variantes : ready (Prêt)

Stories :
- exploration-list.ready - Liste d’exploration prête - ready

## TemporalDependencyBlock

Affiche des faits de chronologie et de dépendances avec une sémantique de séquence, d’événement sélectionné et de « dépend de ».

Variantes : ready (Prêt)

Stories :
- temporal-dependency.ready - Dépendance temporelle prête - ready
