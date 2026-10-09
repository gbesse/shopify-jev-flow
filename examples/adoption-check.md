# shopify-jev-flow — contrôle d’adoption · adoption check · comprobación de adopción

## Français

Point de départ local, après la préparation indiquée dans le README :

```sh
npm run demo
```

Une demande de retour incertaine doit suivre `manual_review` même si une route automatique paraît probable. Vérifiez aussi que rejouer le même `decisionId` ne répète pas l’effet.

## English

Local starting point, after the setup described in the README:

```sh
npm run demo
```

An uncertain return request should follow `manual_review` even when an automatic route seems likely. Also check that replaying the same `decisionId` does not repeat an effect.

## Español

Punto de partida local, después de la preparación descrita en el README:

```sh
npm run demo
```

Una solicitud de devolución incierta debe seguir `manual_review` aunque parezca probable una ruta automática. Compruebe que repetir el mismo `decisionId` no repita el efecto.
## Variante synthétique · Synthetic variation · Variante sintética

```text
decisionId="synthetic-return-1"; retry_decisionId="synthetic-return-1"
```

FR : adaptez une copie de la fixture locale à cette situation, puis vérifiez le comportement décrit ci-dessus. Les valeurs sont illustratives, pas des résultats Jev mesurés.

EN: adapt a copy of the local fixture to this situation, then check the behavior described above. Values are illustrative, not measured Jev output.

ES: adapte una copia de la fixture local a esta situación y compruebe el comportamiento descrito arriba. Los valores son ilustrativos, no resultados Jev medidos.
