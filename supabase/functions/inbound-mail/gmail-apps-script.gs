/**
 * ════════════════════════════════════════════════════════════════════
 * Gmail → Hub Astorya — déclencheur de demandes de devis entrantes
 * ════════════════════════════════════════════════════════════════════
 *
 * À déployer dans Google Apps Script sur le compte daviaud13@gmail.com :
 *   1. https://script.google.com → Nouveau projet
 *   2. Coller ce code
 *   3. Renseigner WEBHOOK_URL et WEBHOOK_TOKEN ci-dessous
 *   4. Déclencheurs (icône horloge) → Ajouter un déclencheur :
 *        - Fonction : checkInbox
 *        - Source : Déclencheur horaire → Toutes les 5 minutes
 *   5. Autoriser l'accès Gmail au premier lancement
 *
 * À chaque exécution, lit les emails NON LUS de la boîte de réception,
 * les POST vers l'Edge Function inbound-mail du Hub, puis les marque
 * comme lus + applique un libellé "TraitéHub" pour ne pas les retraiter.
 * ════════════════════════════════════════════════════════════════════ */

// ── Configuration ────────────────────────────────────────────────────
var WEBHOOK_URL   = "https://<PROJECT_REF>.supabase.co/functions/v1/inbound-mail";
var WEBHOOK_TOKEN = "<INBOUND_WEBHOOK_TOKEN>"; // doit matcher la variable d'env de l'Edge Function
var PROCESSED_LABEL = "TraitéHub";
var MAX_PER_RUN = 10; // limite par exécution (évite les timeouts)

function checkInbox() {
  var label = GmailApp.getUserLabelByName(PROCESSED_LABEL) || GmailApp.createLabel(PROCESSED_LABEL);
  // Threads non lus dans la boîte de réception, non encore traités
  var threads = GmailApp.search('is:unread in:inbox -label:' + PROCESSED_LABEL, 0, MAX_PER_RUN);

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();
    // On ne traite que le 1er message du thread (la demande initiale)
    var msg = messages[0];

    var payload = {
      from_name:  msg.getFrom().replace(/<.*>/, "").trim(),
      from_email: extractEmail(msg.getFrom()),
      to_email:   msg.getTo(),
      subject:    msg.getSubject(),
      body_text:  msg.getPlainBody(),
      received_at: msg.getDate().toISOString(),
      attachments: msg.getAttachments().map(function (a) {
        return { filename: a.getName(), content_type: a.getContentType(), size_bytes: a.getSize() };
      }),
    };

    try {
      var res = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: "post",
        contentType: "application/json",
        headers: { "X-Inbound-Token": WEBHOOK_TOKEN },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      var code = res.getResponseCode();
      if (code >= 200 && code < 300) {
        // Succès : marque lu + libellé traité
        thread.markRead();
        thread.addLabel(label);
        Logger.log("✓ Transmis : " + payload.subject);
      } else {
        Logger.log("✗ Échec HTTP " + code + " : " + res.getContentText());
      }
    } catch (e) {
      Logger.log("✗ Erreur réseau : " + e);
    }
  }
}

function extractEmail(from) {
  var m = from.match(/<(.+?)>/);
  return m ? m[1].trim() : from.trim();
}
