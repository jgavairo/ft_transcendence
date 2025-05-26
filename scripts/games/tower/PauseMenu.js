// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
export class PauseMenu {
    constructor(client) {
        this.client = client;
        this.isVisible = false;
        this.layer = new Konva.Layer();
        this.createPauseMenu();
        client.getStage().add(this.layer);
        this.layer.hide();
    }
    createPauseMenu() {
        // Fond semi-transparent
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: 1200,
            height: 800,
            fill: 'black',
            opacity: 0.7
        });
        // Fenêtre de pause
        const menuWindow = new Konva.Rect({
            x: 400,
            y: 250,
            width: 400,
            height: 300,
            fill: '#2C3E50',
            stroke: '#ECF0F1',
            strokeWidth: 2,
            cornerRadius: 10
        });
        // Titre
        const title = new Konva.Text({
            x: 450,
            y: 280,
            width: 300,
            text: 'PAUSE',
            fontSize: 36,
            fontFamily: 'Press Start 2P',
            fill: 'white',
            align: 'center'
        });
        // Bouton Reprendre
        const resumeButton = this.createButton(450, 350, 300, 50, 'RESUME');
        resumeButton.on('click', () => this.toggle());
        // Bouton Quitter
        const quitButton = this.createButton(450, 420, 300, 50, 'QUIT');
        quitButton.on('click', () => {
            this.client.quitMatch();
        });
        this.layer.add(background);
        this.layer.add(menuWindow);
        this.layer.add(title);
        this.layer.add(resumeButton);
        this.layer.add(quitButton);
    }
    createButton(x, y, width, height, text) {
        const group = new Konva.Group();
        const buttonBg = new Konva.Rect({
            x: x,
            y: y,
            width: width,
            height: height,
            fill: '#34495E',
            stroke: '#ECF0F1',
            strokeWidth: 2,
            cornerRadius: 5
        });
        const buttonText = new Konva.Text({
            x: x,
            y: y + height / 2 - 10,
            width: width,
            text: text,
            fontSize: 20,
            fontFamily: 'Press Start 2P',
            fill: 'white',
            align: 'center'
        });
        group.add(buttonBg);
        group.add(buttonText);
        // Effets de survol
        group.on('mouseenter', () => {
            buttonBg.fill('#2980B9');
            document.body.style.cursor = 'pointer';
            this.layer.batchDraw();
        });
        group.on('mouseleave', () => {
            buttonBg.fill('#34495E');
            document.body.style.cursor = 'default';
            this.layer.batchDraw();
        });
        return group;
    }
    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.layer.show();
        }
        else {
            this.layer.hide();
        }
        this.layer.draw();
    }
    destroy() {
        if (this.layer) {
            this.layer.destroy();
        }
    }
}
