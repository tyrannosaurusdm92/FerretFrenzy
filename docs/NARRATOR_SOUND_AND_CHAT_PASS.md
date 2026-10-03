# Narrator sound + chat pass

The integrated narrator now has two independent output surfaces: device speech and public text chat.

* **Speech:** controlled by the same Ferret Frenzy master sound control used by game audio. Mute immediately cancels current speech and blocks future speech. Low/full sound set SpeechSynthesis utterance volume to the current master level.
* **Chat:** remains text-visible even when sound is muted. This is intentional for accessibility and because a sound toggle should not erase readable public announcements.
* **Private narration:** never posts to chat. It remains local and is gated by the private-headphones confirmation.
* **Shared narration:** the host-owned narrator can automatically post phase announcements to `#narrator` or manually post a narrator line into any public gameplay channel.
* **Turn Mode:** narrator/system announcements bypass player turn mute so rules/phase cues cannot be silenced by the floor queue.
