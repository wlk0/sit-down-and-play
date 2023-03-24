class TimedNotificationInfo 
{
    constructor(iconCss, additionalCss)
    {
        this.visible = false;
        this.question = new Question(iconCss).addClass(additionalCss);
    }

    isVisible()
    {
        return this.question.isVisible();
    }

    show()
    {
        if (this.isVisible())
            return false;

        this.question.show(this.getTitle(), this.getText(), this.getButtonText());
        return true;
    }

    getTitle()
    {
        return "";
    }

    getText()
    {
        return "";
    }

    getButtonText()
    {
        return "OK";
    }


}

class PageRefreshInfo extends TimedNotificationInfo
{
    constructor()
    {
        super("fa-exclamation-circle", "notification-line-countdown-10s");

        this.reason = "";
    }

    hideCancel()
    {
        return true;
    }

    onForceRefresh()
    {
        window.location.reload();
    }

    onRefresh()
    {
        if (this.isVisible())
            this.onForceRefresh();
    }

    show(reason)
    {
        if (typeof reason !== "undefined")
            this.reason = reason;

        this.question.onOk(this.onForceRefresh.bind(this));
        this.question.hideCancel();
        if (super.show())
            setTimeout(this.onRefresh.bind(this), 1000 * 10);
    }

    getTitle()
    {
        return "Connectivity Problem";
    }

    getText()
    {
        if (this.reason === "")
            return "It seems the connection to the server was lost.<br><br>This page will be reloaded in 10 seconds";
        else
            return `Connection lost due to the reason<br><br><span class="question-question-reason">${this.reason}</span><br><br>This page will be reloaded in 10 seconds`;
    }

    getButtonText()
    {
        return "Reload now";
    }
}

class ReDeckInfoNotification extends TimedNotificationInfo
{
    constructor()
    {
        super("fa-recycle", "");
    }

    static wasVisible = false;

    show()
    {
        if (!ReDeckInfoNotification.wasVisible)
        {
            ReDeckInfoNotification.wasVisible = true;
            super.show();
        }
    }

    getTitle()
    {
        return "Deck Notification";
    }

    getText()
    {
        return "Your deck is about to exhaust. It will be reshuffled automatically if needed. Just keep on drawing.";
    }

    getButtonText()
    {
        return "Got it.";
    }
}

