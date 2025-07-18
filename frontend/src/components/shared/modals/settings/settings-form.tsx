import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import React from "react";
import posthog from "posthog-js";
import { I18nKey } from "#/i18n/declaration";
import { organizeModelsAndProviders } from "#/utils/organize-models-and-providers";
import { DangerModal } from "../confirmation-modals/danger-modal";
import { extractSettings } from "#/utils/settings-utils";
import { ModalBackdrop } from "../modal-backdrop";
import { ModelSelector } from "./model-selector";
import { Settings } from "#/types/settings";
import { BrandButton } from "#/components/features/settings/brand-button";
import { KeyStatusIcon } from "#/components/features/settings/key-status-icon";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { HelpLink } from "#/components/features/settings/help-link";
import { useSaveSettings } from "#/hooks/mutation/use-save-settings";

interface SettingsFormProps {
  settings: Settings;
  models: string[];
  onClose: () => void;
}

export function SettingsForm({ settings, models, onClose }: SettingsFormProps) {
  const { mutate: saveUserSettings } = useSaveSettings();

  const location = useLocation();
  const { t } = useTranslation();

  const formRef = React.useRef<HTMLFormElement>(null);

  const [confirmEndSessionModalOpen, setConfirmEndSessionModalOpen] =
    React.useState(false);

  const handleFormSubmission = async (formData: FormData) => {
    const newSettings = extractSettings(formData);

    await saveUserSettings(newSettings, {
      onSuccess: () => {
        onClose();

        posthog.capture("settings_saved", {
          LLM_MODEL: newSettings.LLM_MODEL,
          LLM_API_KEY_SET: newSettings.LLM_API_KEY_SET ? "SET" : "UNSET",
          SEARCH_API_KEY_SET: newSettings.SEARCH_API_KEY ? "SET" : "UNSET",
          REMOTE_RUNTIME_RESOURCE_FACTOR:
            newSettings.REMOTE_RUNTIME_RESOURCE_FACTOR,
        });
      },
    });
  };

  const handleConfirmEndSession = () => {
    const formData = new FormData(formRef.current ?? undefined);
    handleFormSubmission(formData);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (location.pathname.startsWith("/conversations/")) {
      setConfirmEndSessionModalOpen(true);
    } else {
      handleFormSubmission(formData);
    }
  };

  const isLLMKeySet = settings.LLM_API_KEY_SET;

  return (
    <div>
      <form
        ref={formRef}
        data-testid="settings-form"
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4">
          <ModelSelector
            models={organizeModelsAndProviders(models)}
            currentModel={settings.LLM_MODEL}
          />

          <SettingsInput
            testId="llm-api-key-input"
            name="llm-api-key-input"
            label={t(I18nKey.SETTINGS_FORM$API_KEY)}
            type="password"
            className="w-full"
            placeholder={isLLMKeySet ? "<hidden>" : ""}
            startContent={isLLMKeySet && <KeyStatusIcon isSet={isLLMKeySet} />}
          />

          <HelpLink
            testId="llm-api-key-help-anchor"
            text={t(I18nKey.SETTINGS$DONT_KNOW_API_KEY)}
            linkText={t(I18nKey.SETTINGS$CLICK_FOR_INSTRUCTIONS)}
            href="https://deskdev.ai/usage/local-setup#getting-an-api-key"
          />
        </div>

        <div className="flex flex-col gap-2">
          <BrandButton
            testId="save-settings-button"
            type="submit"
            variant="primary"
            className="w-full"
          >
            {t(I18nKey.BUTTON$SAVE)}
          </BrandButton>
        </div>
      </form>

      {confirmEndSessionModalOpen && (
        <ModalBackdrop>
          <DangerModal
            title={t(I18nKey.MODAL$END_SESSION_TITLE)}
            description={t(I18nKey.MODAL$END_SESSION_MESSAGE)}
            buttons={{
              danger: {
                text: t(I18nKey.BUTTON$END_SESSION),
                onClick: handleConfirmEndSession,
              },
              cancel: {
                text: t(I18nKey.BUTTON$CANCEL),
                onClick: () => setConfirmEndSessionModalOpen(false),
              },
            }}
          />
        </ModalBackdrop>
      )}
    </div>
  );
}
