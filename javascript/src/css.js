import { css } from './zyX-es6.js'
css`
.BetterPromptComposer {
    display: grid;
    gap: 5px;
    position: relative;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 5px;
    padding: .5em;

& .Button {
    padding: 0 .5em;
    background: #4b5563;
    color: white;
    border-radius: 5px;
    cursor: pointer;
}

& .Header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ffffff3d;
    padding: .5em;
    & .title {
        color: white;
    }
    & .RightSide {
        display: flex;
        gap: 5px;
    }
}

& .Compose {
    display: block;
    padding: .5em;
    background: #4b5563;
    color: white;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
}

& .NodeFeild {
    border: 1px solid #ffffff3d;
    padding: 5px;
    border-radius: 13px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

& .footer {
    display: flex;
    padding: 0 .5em;
    gap: 5px;

    > .Button.Resolution.active {
        background: orange;
    }
}

.Node {
    border: 1px solid #ffffff40;
    padding: 2px;
    border-radius: 8px;
    display: flex;
    gap: 5px;
    height: min-content;

    & .FlotingButtons {
        position: absolute;
        width: 20%;
        height: 0;
        font-size: 8px;
        opacity: 0;
        display: grid;

        & > div {
            position: absolute;
            display: grid;
            grid-auto-flow: column;
            left: 30px;
            top: -10px;
            align-content: space-between;
            height: 100%;
        }

        & .Button {
            padding: 0px 20px;
            line-height: 7px;
            background-color: transparent;
            cursor: copy;
        }
    }

    &:hover .FlotingButtons {
        opacity: 1;
    }

    & > .Controls {
        user-select: none;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        height: max-content;

        & .Button {
            font-size: 13px;
            padding: 0 5px;
            background: #4b5563;
        }
    }

    & > .NodeArea {
        flex-grow: 1;

        & > .BasicText {
            background: unset;
            border-radius: 5px;
            min-height: 1em;
            width: 100%;
            color: white;
            padding: 5px;
        }

        & > .Options {
            display: flex;
            gap: 5px;

            & label {
                display: flex;
                gap: 5px;
                align-items: center;
            }

            & input[type="radio"] {
                background-color: #232739;
                border-radius: 100%;
            }
        }
    }

}
}
`
