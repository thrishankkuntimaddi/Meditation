package com.thrishank.meditation;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.provider.Settings;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * System-level focus for meditation sessions.
 *
 *  - enable():  switches Do Not Disturb to "Alarms only" (notifications and
 *               calls are silenced; alarms and media still play, so the
 *               meditation bells are heard). With muteMedia=true — used on a
 *               device that is *listening* while another device meditates —
 *               media is muted as well.
 *  - disable(): restores exactly what the user had before.
 *
 * Changing Do Not Disturb needs the user to grant "Do Not Disturb access"
 * once, via requestPolicyAccess().
 */
@CapacitorPlugin(name = "FocusMode")
public class FocusModePlugin extends Plugin {

    private Integer previousFilter = null;
    private boolean mutedMedia = false;

    private NotificationManager notifications() {
        return (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private AudioManager audio() {
        return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("policyAccess", notifications().isNotificationPolicyAccessGranted());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPolicyAccess(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void enable(PluginCall call) {
        boolean muteMedia = Boolean.TRUE.equals(call.getBoolean("muteMedia", false));
        boolean dnd = false;
        try {
            NotificationManager nm = notifications();
            if (nm.isNotificationPolicyAccessGranted()) {
                if (previousFilter == null) previousFilter = nm.getCurrentInterruptionFilter();
                nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS);
                dnd = true;
            }
        } catch (Exception ignored) {
        }
        try {
            if (muteMedia && !mutedMedia) {
                audio().adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0);
                mutedMedia = true;
            }
        } catch (Exception ignored) {
        }
        JSObject result = new JSObject();
        result.put("dnd", dnd);
        result.put("muted", mutedMedia);
        call.resolve(result);
    }

    @PluginMethod
    public void disable(PluginCall call) {
        restore();
        call.resolve();
    }

    @PluginMethod
    public void keepAwake(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
        call.resolve();
    }

    private void restore() {
        try {
            NotificationManager nm = notifications();
            if (previousFilter != null && nm.isNotificationPolicyAccessGranted()) {
                nm.setInterruptionFilter(previousFilter);
            }
        } catch (Exception ignored) {
        }
        previousFilter = null;
        if (mutedMedia) {
            try {
                audio().adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0);
            } catch (Exception ignored) {
            }
            mutedMedia = false;
        }
    }

    @Override
    protected void handleOnDestroy() {
        // Never leave the phone stuck in Do Not Disturb if the app is closed mid-session
        restore();
        super.handleOnDestroy();
    }
}
