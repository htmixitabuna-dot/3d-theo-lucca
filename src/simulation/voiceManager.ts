/**
 * Sistema de Síntese de Voz e Diálogos em Português (PT-BR)
 * Suporta vozes Masculinas e Femininas com pitch/rate ajustáveis,
 * saudações com o nome do personagem principal (Theo Lucca) e dicas valiosas!
 */

export type VoiceGender = 'male' | 'female';

export interface NPCSpeechData {
  name: string;
  role: string;
  gender: VoiceGender;
  tips: string[];
}

class CityVoiceManager {
  private isMuted: boolean = false;
  private hasUserInteracted: boolean = false;
  private lastSpokenTime: Record<string, number> = {};
  private globalCooldown: number = 0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;

  private onSpeechStartCallbacks: ((name: string, text: string, gender: VoiceGender) => void)[] = [];
  private onSpeechEndCallbacks: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.hasUserInteracted = true;
        if ('speechSynthesis' in window) {
          // Aquece o sintetizador com voz vazia para destravar no iOS/Android
          try {
            const warmUp = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(warmUp);
          } catch {
            // ignore
          }
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public onSpeechStart(cb: (name: string, text: string, gender: VoiceGender) => void) {
    this.onSpeechStartCallbacks.push(cb);
  }

  public onSpeechEnd(cb: () => void) {
    this.onSpeechEndCallbacks.push(cb);
  }

  /**
   * Obtém a melhor voz do sistema para o gênero requisitado em português
   */
  private getBestVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const ptVoices = voices.filter(
      (v) => v.lang.toLowerCase().includes('pt') || v.lang.toLowerCase().includes('brazil') || v.lang.toLowerCase().includes('portuguese')
    );

    const voiceList = ptVoices.length > 0 ? ptVoices : voices;

    if (gender === 'female') {
      const femaleKeywords = ['luciana', 'maria', 'helena', 'francisca', 'female', 'mulher', 'fernanda', 'vitória', 'raquel', 'letícia', 'zira', 'google português'];
      const match = voiceList.find((v) =>
        femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (match) return match;
    } else {
      const maleKeywords = ['felipe', 'daniel', 'joão', 'carlos', 'male', 'homem', 'ricardo', 'jorge', 'david', 'antonio', 'enrique'];
      const match = voiceList.find((v) =>
        maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      if (match) return match;
    }

    return voiceList[0] || null;
  }

  /**
   * Fala a frase em voz alta com sintetizador de voz masculino ou feminino
   */
  public speak(
    speakerName: string,
    text: string,
    gender: VoiceGender = 'male',
    forced: boolean = false
  ): boolean {
    if (this.isMuted) return false;

    const now = Date.now();
    // Cooldown global de 2.5s para evitar sobreposição caótica
    if (!forced && now < this.globalCooldown) {
      return false;
    }

    // Cooldown específico do personagem (não repete o mesmo em menos de 7 segundos)
    if (!forced && this.lastSpokenTime[speakerName] && now - this.lastSpokenTime[speakerName] < 7000) {
      return false;
    }

    this.lastSpokenTime[speakerName] = now;
    this.globalCooldown = now + 2600;

    // Dispara callbacks de UI (balão de fala e HUD animada)
    this.onSpeechStartCallbacks.forEach((cb) => cb(speakerName, text, gender));

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Interrompe fala anterior

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';

        const chosenVoice = this.getBestVoice(gender);
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        if (gender === 'female') {
          utterance.pitch = 1.25; // Tom feminino mais agudo e acolhedor
          utterance.rate = 1.05;  // Ritmo alegre
        } else {
          utterance.pitch = 0.95; // Tom masculino firme e enérgico
          utterance.rate = 1.02;  // Ritmo dinâmico
        }

        utterance.volume = 1.0;

        utterance.onend = () => {
          this.isSpeaking = false;
          this.onSpeechEndCallbacks.forEach((cb) => cb());
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          this.onSpeechEndCallbacks.forEach((cb) => cb());
        };

        this.currentUtterance = utterance;
        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch (err) {
        console.warn('SpeechSynthesis falhou:', err);
      }
    }

    return false;
  }

  /**
   * Theo Lucca falando sozinho ou com a cidade
   */
  public speakTheoLucca(customText?: string) {
    const defaultTexts = [
      'Oi pessoal! Eu sou o Theo Lucca! Vamos cumprir as missões e fazer a cidade crescer!',
      'Olha só como a cidade está gigante! Qual é o próximo trabalho que vamos fazer?',
      'Uau! O mapa de navegação está mostrando novos bairros incríveis abertos!',
      'Vou acelerar com o carro e explorar cada cantinho da nossa cidade!',
    ];
    const text = customText || defaultTexts[Math.floor(Math.random() * defaultTexts.length)];
    this.speak('Theo Lucca', text, 'male', true);
  }
}

export const cityVoiceManager = new CityVoiceManager();
