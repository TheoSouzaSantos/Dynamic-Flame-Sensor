package expo.modules.dfsmodule
import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.dfsmodule.R

class DfsmoduleModule : Module() {
    private val CHANNEL_ID = "notificacoes"
    private val notificationId = 123

  override fun definition() = ModuleDefinition {
    Name("Dfsmodule")
    Events("onChange")
    Constant("PI") { Math.PI }
      OnCreate {

          Log.d("Dfsmodule", "ENTREI NA FUNÇÃO createNotificationChannel")
          val context = appContext.reactContext
          if(context != null) {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                  val name = "Notificações"
                  val descriptionText = "Notificações do sistema"
                  val importance = NotificationManager.IMPORTANCE_HIGH
                  val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                      description = descriptionText
                  }

                  val notificationManager: NotificationManager =
                      context.getSystemService(NotificationManager::class.java) as
                              NotificationManager
                  notificationManager.createNotificationChannel(channel)
              }
          }

      }
    AsyncFunction("enviarNotificacao") {
        Log.d("Dfsmodule", "ENTREI NA FUNÇÃO enviarNotificacao")
        val context = appContext.reactContext
        if(context != null) {
            val largeIcon = BitmapFactory.decodeResource(
                context.resources,
                context.applicationInfo.icon
            )
            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.baseline_local_fire_department_24)
                .setLargeIcon(largeIcon)
                .setContentTitle("PERIGO!")
                .setContentText("CHAMA FOI DETECTADA")
                .setStyle(
                    NotificationCompat.BigTextStyle()
                        .bigText("Seu sensor detectou fogo, procure o local ou ative o corpo de bombeiros!")
                )

            with(NotificationManagerCompat.from(context)){
                if(ActivityCompat.checkSelfPermission(
                        context,
                        Manifest.permission.POST_NOTIFICATIONS
                        )!= PackageManager.PERMISSION_GRANTED){
                    Log.d("Dfsmodule", "PERMISSÃO DE NOTIFICAÇÃO NÃO CONCEDIDA")
                    return@with
                }
                Log.d("Dfsmodule", "ENVIANDO NOTIFICAÇÃO")
                notify(notificationId, builder.build())
            }
        }
    }
    AsyncFunction("setValueAsync") {
      value: String -> sendEvent(
        "onChange",
        mapOf( "value" to value ))
    }
  }
}